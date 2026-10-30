const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/demo/requester');
  await page.getByRole('button',{name:'New blood request',exact:true}).waitFor();
  assert.equal(await page.locator('nav a').count(),3);
  await page.getByRole('button',{name:'Switch to Tamil'}).click();
  await page.getByRole('button',{name:'இரத்தம் தேவை',exact:true}).waitFor();
  await page.reload(); await page.getByRole('button',{name:'இரத்தம் தேவை',exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'ta');
  await page.getByRole('button',{name:'இரத்தம் தேவை',exact:true}).click();
  await page.getByLabel('மருத்துவமனை பெயர்').waitFor();
  assert.equal(await page.getByText('Blood group',{exact:true}).count(),0);
  await page.screenshot({path:'D:/LifeLink-preview-temp/tamil-request.png',fullPage:true});
  await page.getByRole('button',{name:'ஆங்கிலத்திற்கு மாற்று'}).click();
  await page.getByLabel('Hospital name').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.getByRole('button',{name:'Close form'}).click();
  await page.getByRole('button',{name:/O\+.*Demo General Hospital/}).click();
  await page.getByRole('article',{name:'Request progress'}).waitFor();
  await page.getByRole('button',{name:'Switch to Tamil'}).click();
  await page.getByRole('article',{name:'கோரிக்கையின் நிலை'}).waitFor();
  await page.locator('summary').filter({hasText:'தேடல் விவரங்கள்'}).click();
  const english=await page.locator('main').evaluate(el=>{const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const out=[];while(w.nextNode()){const s=w.currentNode.textContent.trim();if(/[A-Za-z]{3}/.test(s))out.push(s);}return out;});
  console.log('Tamil remaining names/labels:',JSON.stringify(english));
  await page.screenshot({path:'D:/LifeLink-preview-temp/tamil-progress.png',fullPage:true});
  await page.getByRole('link',{name:'என் விவரங்கள்'}).click();await page.getByLabel('பெயர்',{exact:true}).waitFor();
  assert.equal(await page.getByText('Blood Requests',{exact:true}).count(),0);
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('link',{name:'இரத்தம் வழங்க'}).click();
  await page.getByLabel('இரத்தம் வழங்கத் தயார்',{exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path:'D:/LifeLink-preview-temp/tamil-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]); console.log('PASS: 3-item navigation, both language directions, reload persistence, translated form/progress/profile and mobile layout.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
