import {chromium,expect} from '@playwright/test'
import assert from 'node:assert/strict'
const base=process.env.TEST_ORIGIN??'http://localhost:5193'
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('This browser smoke test only runs on localhost')
const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_CHANNEL ? {channel:process.env.TEST_BROWSER_CHANNEL} : {})})
try{
  const page=await browser.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(base,{waitUntil:'networkidle'})
  const connect=page.getByRole('button',{name:'Connect wallet',exact:true}).first()
  await expect(connect).toBeEnabled({timeout:20000})
  await connect.click()
  const dialog=page.getByRole('dialog',{name:'log in or sign up'})
  await expect(dialog.getByRole('button',{name:'Coinbase Wallet',exact:true})).toBeVisible({timeout:20000})
  await expect(dialog.getByRole('button',{name:'Farcaster',exact:true})).toBeVisible()
  await dialog.getByRole('button',{name:'close modal'}).click()
  await page.evaluate(async()=>{
    await caches.open('start-url');await caches.open('w3rk-cache');await caches.open('workbox-old');await caches.open('unrelated-cache')
    for(const registration of await navigator.serviceWorker.getRegistrations())await registration.unregister()
  })
  await page.reload({waitUntil:'networkidle'})
  await page.evaluate(async()=>{await navigator.serviceWorker.ready})
  await page.waitForTimeout(1500)
  const cachesPresent=await page.evaluate(()=>caches.keys())
  assert.ok(!cachesPresent.includes('start-url'));assert.ok(!cachesPresent.includes('w3rk-cache'));assert.ok(!cachesPresent.includes('workbox-old'));assert.ok(cachesPresent.includes('unrelated-cache'))
  assert.ok((await page.locator('body').innerText()).includes('w3rk'))
  for(const path of ['/about','/j','/s','/chat','/profile']){
    const response=await page.goto(base+path,{waitUntil:'networkidle'})
    assert.equal(response.status(),200)
    assert.ok((await page.locator('body').innerText()).length>50)
  }
  assert.deepEqual(errors,[])
  console.log('PASS: production browser hydration, Privy Coinbase/Farcaster chooser, navigation and legacy service-worker cache cleanup')
}finally{await browser.close()}
