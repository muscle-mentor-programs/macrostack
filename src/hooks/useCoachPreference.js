import { useState, useEffect } from 'react'
import useStore from '../store'
// Only UI preferences are retained; no client records or message contents.
export default function useCoachPreference(name, fallback) {
 const userId=useStore(s=>s.currentUser?.id)||'guest'
 const key=`macrostack-coach-ui:${userId}:${name}`
 const [value,setValue]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(key))??fallback}catch{return fallback}})
 useEffect(()=>{try{sessionStorage.setItem(key,JSON.stringify(value))}catch{/* Optional persistence. */}},[key,value])
 return [value,setValue]
}
