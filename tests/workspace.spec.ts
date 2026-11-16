import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const fixture=(name:string)=>path.join(root,'public/examples',`sample-${name}.apk`);
async function sample(page:any){await page.goto('/');await page.getByRole('button',{name:'Try a sample comparison'}).click();await expect(page.locator('.report-card').first()).toBeVisible();}

test('welcome, sample comparison, permission and native-library questions, size view, report export',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Compare releases.'})).toBeVisible();
 await page.screenshot({path:'docs/screenshots/workspace.png',fullPage:true});
 await page.getByRole('button',{name:'Try a sample comparison'}).click();
 await expect(page.locator('.report-card').first()).toContainText('1.4.0 → 1.5.0');
 await expect(page.locator('.report-card').first()).toContainText('SAMPLE FILES');
 await expect(page.locator('#ring-legend')).toBeHidden();await expect(page.locator('#release-ring')).toHaveAttribute('aria-label',/Removed: 16.7%.*Modified: 66.7%/);
 await expect(page.locator('#release-ring')).toHaveAttribute('aria-label',/Added: 28.6%.*Modified: 57.1%/);await expect(page.locator('.change-ring')).toHaveCount(0);
 await page.getByRole('button',{name:'Permissions',exact:true}).click();
 await expect(page.locator('.permission.added')).toHaveText('android.permission.CAMERA');
 await page.locator('#prompt').fill('Which native libraries were added?');await page.getByRole('button',{name:'Send message'}).click();
 await expect(page.locator('.message-text').last()).toContainText('lib/arm64-v8a/libcapture.so');
 await page.getByRole('button',{name:'Size breakdown',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Package size breakdown'})).toBeVisible();
 await page.locator('#conversation').evaluate(e=>e.scrollTo(0,0));
 await page.screenshot({path:'docs/screenshots/comparison.png',fullPage:true});
 await page.getByRole('button',{name:'Export report'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download JSON report'}).click();
 const file=await (await download).path();const report=JSON.parse(readFileSync(file!,'utf8'));
 expect(report.report.permissions_added).toEqual(['android.permission.CAMERA']);expect(report.sample).toBe(true);
 expect(report.report.added).toBe(2);expect(report.report.removed).toBe(1);expect(report.report.modified).toBe(4);
 expect(errors).toEqual([]);
});

test('real upload flow, file filtering and local persistence',async({page})=>{
 await page.goto('/');await page.locator('#before-file').setInputFiles(fixture('before'));await page.locator('#after-file').setInputFiles(fixture('after'));
 await expect(page.locator('#prompt')).toHaveValue('Compare these releases. What changed?');
 await page.getByRole('button',{name:'Send message'}).click();await expect(page.locator('.report-card').first()).toBeVisible();
 await expect(page.locator('.report-card').first()).not.toContainText('SAMPLE FILES');
 await page.getByRole('button',{name:'File changes',exact:true}).click();
 await page.getByRole('textbox',{name:'Filter file paths'}).fill('libcapture');await expect(page.locator('.file-changes').last().locator('.change-row')).toHaveCount(1);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('releaselens.sessions')||'[]').length)).toBeGreaterThan(0);
 await expect(page.locator('.rail')).toBeHidden();
});

test('bad archives and unsupported formats return useful errors',async({page})=>{
 await page.goto('/');await page.locator('#before-file').setInputFiles({name:'wrong.txt',mimeType:'text/plain',buffer:Buffer.from('bad')});
 await expect(page.locator('#toast')).toHaveText('Choose an APK or ZIP archive.');
 await page.locator('#before-file').setInputFiles({name:'broken.apk',mimeType:'application/octet-stream',buffer:Buffer.from('not a zip')});await page.locator('#after-file').setInputFiles(fixture('after'));
 await page.getByRole('button',{name:'Send message'}).click();await expect(page.locator('.message-text').last()).toContainText('not a readable ZIP');
 await expect(page.getByRole('button',{name:'Send message'})).toBeVisible();
});

test('missing files, supported formats and unsupported chat question',async({page})=>{
 await page.goto('/');await page.locator('#prompt').fill('Compare these');await page.getByRole('button',{name:'Send message'}).click();await expect(page.locator('.message-text').last()).toContainText('Attach a previous release');
 await page.reload();await page.getByRole('button',{name:'What can I compare?'}).click();await expect(page.locator('dialog')).toContainText('100 MiB');await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('button',{name:'Try a sample comparison'}).click();await expect(page.locator('.report-card').first()).toBeVisible();
 await page.locator('#prompt').fill('Write a poem');await page.getByRole('button',{name:'Send message'}).click();await expect(page.locator('.message-text').last()).toContainText('without a language model');
 await expect(page.locator('.rail')).toBeHidden();
});

test('mobile view has visible uploads and no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('#welcome')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'docs/screenshots/mobile.png',fullPage:true});
 await expect(page.locator('#before-pick')).toBeVisible();await expect(page.locator('#after-pick')).toBeVisible();await expect(page.locator('.rail')).toBeHidden();
 await page.getByRole('button',{name:'Try a sample comparison'}).click();await expect(page.locator('.report-card').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('compiled Android binary manifest parses on a real existing APK',async({page})=>{
 const apk=process.env.RELEASELENS_INTEGRATION_APK||'';test.skip(!apk||!existsSync(apk),'Set RELEASELENS_INTEGRATION_APK for an existing compiled Android APK');
 await page.goto('/');await page.locator('#before-file').setInputFiles(apk);await page.locator('#after-file').setInputFiles(apk);
 await page.getByRole('button',{name:'Send message'}).click();await expect(page.locator('.report-identity')).toHaveText('com.mouseformobile');
 await expect(page.locator('.report-card').first()).toContainText('0.1 → 0.1');
 await page.getByRole('button',{name:'Permissions',exact:true}).click();await expect(page.locator('.permission')).toHaveText('android.permission.INTERNET');
 await expect(page.locator('.warning-text')).toHaveCount(0);
});


test('replacing one file retains its counterpart and starts a fresh conversation',async({page})=>{
 await sample(page);
 await page.locator('#after-file').setInputFiles(fixture('before'));
 await expect(page.locator('#before-name')).toHaveText('sample-before.apk');
 await expect(page.locator('#after-name')).toHaveText('sample-before.apk');
 await expect(page.locator('#welcome')).toBeVisible();
 await page.getByRole('button',{name:'Send message'}).click();
 await expect(page.locator('#files-stat')).toHaveText('0');await expect(page.locator('#ring-segments .ring-segment')).toHaveCount(2);await expect(page.locator('#ring-segments .ring-segment:not(.unchanged)')).toHaveCount(0);
});

test('cancel terminates pending analysis and allows another comparison',async({page})=>{
 await page.goto('/');
 await page.route('**/engine/releaselens.wasm',()=>{});
 await page.locator('#before-file').setInputFiles(fixture('before'));await page.locator('#after-file').setInputFiles(fixture('after'));
 await page.getByRole('button',{name:'Send message'}).click();await page.getByRole('button',{name:'Cancel analysis'}).click();
 await expect(page.locator('.message-text').last()).toContainText('Analysis canceled');
 await expect(page.locator('#before-name')).toHaveText('sample-before.apk');
 await page.unroute('**/engine/releaselens.wasm');
 await page.locator('#prompt').fill('Compare releases');await page.getByRole('button',{name:'Send message'}).click();await expect(page.locator('.report-card').first()).toBeVisible();
});

test('Mac app ZIP comparison reads bundle metadata',async({page})=>{
 const zip=process.env.RELEASELENS_INTEGRATION_MAC_ZIP||'';test.skip(!zip||!existsSync(zip),'Set RELEASELENS_INTEGRATION_MAC_ZIP for a zipped Mac app');
 await page.goto('/');await page.locator('#before-file').setInputFiles(zip);await page.locator('#after-file').setInputFiles(zip);await page.getByRole('button',{name:'Send message'}).click();
 await expect(page.locator('.report-card').first()).toContainText('Mac app ZIP');await expect(page.locator('#files-stat')).toHaveText('0');await expect(page.locator('.report-identity')).not.toBeEmpty();await expect(page.locator('.warning-text')).toHaveCount(0);
});

 test('main ring shows percentages for uploaded test ZIPs',async({page})=>{
 await page.goto('/');await expect(page.locator('#ring-segments path')).toHaveCount(0);await expect(page.locator('#ring-legend')).toBeHidden();
 await page.locator('#before-file').setInputFiles(path.join(root,'test/release-before.zip'));await page.locator('#after-file').setInputFiles(path.join(root,'test/release-after.zip'));
 await page.getByRole('button',{name:'Compare releases',exact:true}).click();await expect(page.locator('.report-card').first()).toBeVisible();
 await expect(page.locator('#ring-segments .ring-segment')).toHaveCount(6);
 await page.locator('#ring-segments .ring-segment').first().focus();await expect(page.locator('#segment-tooltip')).toContainText('Removed: 20% (1 file)');expect(await page.locator('#ring-segments .ring-segment').first().evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('none');await page.keyboard.press('Escape');await expect(page.locator('#segment-tooltip')).toBeHidden();
 for(const side of ['before','after']){const parts=page.locator(`#ring-segments .ring-segment[data-side="${side}"]`);expect(await parts.evaluateAll(es=>es.reduce((total,e)=>total+Number(e.getAttribute('data-percent')),0))).toBeCloseTo(100);}
 await expect(page.locator('#release-ring')).toHaveAttribute('aria-label',/Removed: 20%.*Modified: 60%.*Unchanged: 20%.*Added: 20%.*Modified: 60%.*Unchanged: 20%/);
 const desktopRing=await page.locator('#release-ring').boundingBox();expect(desktopRing).not.toBeNull();expect(desktopRing!.width).toBeCloseTo(desktopRing!.height,0);
 await page.screenshot({path:'docs/screenshots/ring-chart.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const mobileRing=await page.locator('#release-ring').boundingBox();expect(mobileRing).not.toBeNull();expect(mobileRing!.width).toBeCloseTo(mobileRing!.height,0);await page.screenshot({path:'docs/screenshots/ring-chart-mobile.png',fullPage:true});
 });

test('desktop workspace fits viewport while chat scrolls internally',async({page})=>{
 for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:1024,height:768}]){
 await page.setViewportSize(viewport);await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 await expect(page.locator('#before-pick')).toBeInViewport();await expect(page.locator('#compare-releases')).toBeInViewport();await expect(page.locator('#prompt')).toBeInViewport();
 const ring=await page.locator('#release-ring').boundingBox();expect(ring!.width).toBeCloseTo(ring!.height,0);
 }
 await page.getByRole('button',{name:'Try a sample comparison'}).click();await expect(page.locator('.report-card').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 await expect(page.locator('#prompt')).toBeInViewport();
});
