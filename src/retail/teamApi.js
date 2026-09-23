import {supabase} from '../lib/supabase';
const result=({data,error})=>{if(error)throw new Error(error.message);return data;};
export const teamDirectory=async oid=>result(await supabase.rpc('retail_team_directory',{oid}));
export const teamCommand=async(action,payload)=>result(await supabase.rpc('retail_team_command',{action,payload}));
export const effectivePermissions=async lid=>result(await supabase.rpc('retail_permissions',{lid}));
export const teamImpact=async sid=>result(await supabase.rpc('retail_team_impact',{sid}));
