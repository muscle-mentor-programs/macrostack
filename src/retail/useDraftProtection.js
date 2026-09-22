import {useEffect} from 'react';
export default function useDraftProtection(dirty,onBlocked){
 useEffect(()=>{
  const protect=e=>{if(!dirty)return;e.preventDefault();if(e.type==='beforeunload')e.returnValue='';else onBlocked('Save or discard your changes before leaving this section.');};
  for(const event of ['retail-before-leave','retail-section-leave','beforeunload'])window.addEventListener(event,protect);
  return()=>{for(const event of ['retail-before-leave','retail-section-leave','beforeunload'])window.removeEventListener(event,protect)};
 },[dirty,onBlocked]);
}
