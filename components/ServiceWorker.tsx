'use client'
import {useEffect} from 'react'
export default function ServiceWorker(){
  useEffect(()=>{if('serviceWorker' in navigator)void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{})},[])
  return null
}
