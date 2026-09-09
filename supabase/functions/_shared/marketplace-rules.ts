export function validateListing(input: Record<string, unknown>) {
  const text = (key: string, min: number, max: number) => {
    const value = String(input[key] ?? '').trim()
    if (value.length < min || value.length > max) throw new Error(`Please check ${key.replaceAll('_',' ')}.`)
    return value
  }
  const price = Number(input.price_cents), days = Number(input.duration_days)
  if (!Number.isInteger(price) || price < 100 || price > 1000000) throw new Error('Price must be between $1 and $10,000.')
  if (!['monthly','one_time'].includes(String(input.billing_mode))) throw new Error('Choose a billing option.')
  if (input.billing_mode === 'one_time' && (!Number.isInteger(days) || days < 1 || days > 730)) throw new Error('Choose 1 to 730 access days.')
  const photo = text('photo_url',0,1000)
  if (photo && new URL(photo).protocol !== 'https:') throw new Error('Photo URL must use HTTPS.')
  return {name:text('name',2,100),headline:text('headline',5,160),bio:text('bio',20,5000),
    specialties:text('specialties',0,500),credentials:text('credentials',0,1000),photo_url:photo,
    price_cents:price,billing_mode:input.billing_mode,duration_days:input.billing_mode==='one_time'?days:null,
    published:input.published===true}
}
export function stripeReady(account: {charges_enabled?: boolean;payouts_enabled?: boolean;capabilities?: {transfers?: string}}) {
  return !!account.charges_enabled && !!account.payouts_enabled && account.capabilities?.transfers==='active'
}
export function accessActive(access: {paid_until:string;disabled?:boolean}|null, now=Date.now()) {
  return !!access && !access.disabled && new Date(access.paid_until).getTime()>now
}
