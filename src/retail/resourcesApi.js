import {supabase} from '../lib/supabase';
const result = ({data,error}) => {if(error) throw new Error(error.message);return data;};
export async function resources(locationId) {
  return result(await supabase.rpc('retail_resource_catalog',{lid:locationId})) || [];
}
export async function resourceCommand(action,payload) {
  return result(await supabase.rpc('retail_resource_command',{action,payload}));
}
export async function resourceAssignments(filters) {
  let q=supabase.from('retail_resource_assignments').select('*, retail_relationships(name)').order('assigned_at',{ascending:false}).limit(500);
  for(const [k,v] of Object.entries(filters)) q=q.eq(k,v);
  return result(await q)||[];
}
export async function resourceStore(locationId) {
 return result(await supabase.from('retail_locations').select('id,organization_id').eq('id',locationId).single());
}

export async function resourceReviewQueue(organizationId) {
 return result(await supabase.rpc('retail_resource_review_queue',{oid:organizationId}))||[];
}
