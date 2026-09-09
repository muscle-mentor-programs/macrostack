// Stripe and database clients are injected so webhook and return-page reconciliation share one path.
// deno-lint-ignore-file no-explicit-any
export async function fulfillMarketplace(stripe: any, db: any, session: any) {
  const orderId=session.metadata?.marketplace_order_id
  if (!orderId || session.metadata?.kind!=='marketplace_coaching' || session.payment_status!=='paid') return
  const {data:order,error}=await db.from('marketplace_orders').select('*').eq('id',orderId).single()
  if(error || !order) throw new Error('Payment order was not found.')
  if(order.state==='paid') return
  if(order.state==='refunded') return
  if(order.session_id!==session.id || session.client_reference_id!==order.buyer_id ||
    session.amount_total!==order.price_cents || session.currency!=='usd') throw new Error('Payment order verification failed.')
  let until: string
  let paymentIntent=session.payment_intent
  if(order.billing_mode==='monthly') {
    const sub=await stripe.subscriptions.retrieve(session.subscription,{expand:['latest_invoice']})
    if(sub.metadata?.marketplace_order_id!==order.id || sub.transfer_data?.destination!==order.destination) throw new Error('Subscription verification failed.')
    if(sub.latest_invoice?.status!=='paid') return
    paymentIntent=sub.latest_invoice.payment_intent
    const end=sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end
    until=new Date(end*1000).toISOString()
  } else {
    const intent=await stripe.paymentIntents.retrieve(paymentIntent)
    if(intent.status!=='succeeded' || intent.transfer_data?.destination!==order.destination || intent.metadata?.marketplace_order_id!==order.id) throw new Error('Payment destination verification failed.')
    // The immutable paid timestamp prevents webhook retries from extending one-time access.
    until=new Date((order.paid_at?new Date(order.paid_at).getTime():Date.now())+order.duration_days*86400000).toISOString()
  }
  const update=await db.from('marketplace_orders').update({subscription_id:session.subscription || null,
    customer_id:session.customer || null,payment_intent_id:paymentIntent || null}).eq('id',order.id)
  if(update.error) throw update.error
  const result=await db.rpc('fulfill_marketplace_order',{p_order:order.id,p_until:until})
  if(result.error) {
    // A client can change connections or the coach can fill their last slot during checkout.
    // Compensate only known business-rule failures. Transient database errors must retry.
    if(result.error.code==='P0001' && paymentIntent) {
      if(session.subscription) {
        const current=await stripe.subscriptions.retrieve(session.subscription)
        if(current.status!=='canceled') await stripe.subscriptions.cancel(session.subscription)
      }
      await stripe.refunds.create({payment_intent:paymentIntent,reverse_transfer:true},{idempotencyKey:`marketplace-unfulfilled-${order.id}`})
      const refunded=await db.from('marketplace_orders').update({state:'refunded'}).eq('id',order.id)
      if(refunded.error) throw refunded.error
      return
    }
    throw result.error
  }
}
export async function syncMarketplaceSubscription(stripe: any, db: any, subscriptionId: string) {
  const sub=await stripe.subscriptions.retrieve(subscriptionId,{expand:['latest_invoice']})
  if(sub.metadata?.kind!=='marketplace_coaching') return
  const {data:order,error}=await db.from('marketplace_orders').select('*').eq('id',sub.metadata.marketplace_order_id).single()
  if(error) throw error
  if(order.state!=='paid') return // Checkout confirmation owns the initial link.
  const values: any={disabled:!['active','canceled'].includes(sub.status),updated_at:new Date().toISOString()}
  if(sub.latest_invoice?.status==='paid' && sub.status==='active') {
    const end=sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end
    if(end) values.paid_until=new Date(end*1000).toISOString()
  }
  // An old subscription event must never overwrite a newer purchase.
  const result=await db.from('marketplace_access').update(values).eq('order_id',order.id)
  if(result.error) throw result.error
}
