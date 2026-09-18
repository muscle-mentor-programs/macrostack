export async function marketplaceReview(db: any, actor: {id:string;role:string}, input: Record<string, any>) {
  if (actor.role !== 'superadmin') throw new Error('Superadmin approval required.')
  if (input.action === 'admin-list') {
    const status = input.status || 'pending'
    if (!['pending','approved','rejected'].includes(status)) throw new Error('Invalid review status.')
    const offset = Number(input.offset || 0)
    if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid page.')
    const {data,error} = await db.from('marketplace_profiles').select('*')
      .eq('approval_status',status).order('updated_at',{ascending:true}).order('coach_id').range(offset,offset+20)
    if (error) throw error
    return {profiles:(data || []).slice(0,20),hasMore:(data || []).length>20}
  }
  if (input.action !== 'admin-review') throw new Error('Unknown review action.')
  if (!['approved','rejected'].includes(input.decision)) throw new Error('Invalid review decision.')
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) throw new Error('Refresh the profile before reviewing it.')
  const note = String(input.note || '').trim()
  if (note.length > 2000 || (input.decision === 'rejected' && !note)) throw new Error('Include a reason for the coach (up to 2,000 characters).')
  const {data,error} = await db.from('marketplace_profiles').update({
    approval_status:input.decision,review_note:note,reviewed_by:actor.id,reviewed_at:new Date().toISOString(),
  }).eq('coach_id',input.coach_id).eq('revision',input.revision).eq('published',true)
    .in('approval_status',input.decision === 'approved' ? ['pending'] : ['pending','approved'])
    .select('*').maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This profile changed or was already reviewed. Refresh and review the latest version.')
  return {profile:data}
}
