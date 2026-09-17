import { useState } from 'react'
import useStore from '../store'
// Private drafts live only in this browser tab's memory, scoped by account.
const drafts=new Map()
export default function useSessionDraft(name, initial='') {
 const account=useStore(s=>s.currentUser?.id)
 const key=`${account}:${name}`
 const [values,setValues]=useState(()=>new Map(drafts))
 const value=values.has(key)?values.get(key):initial
 const update=next=>setValues(previous=>{const result=typeof next==='function'?next(previous.get(key)??initial):next;const copy=new Map(previous);copy.set(key,result);drafts.set(key,result);return copy})
 return [value,update]
}
