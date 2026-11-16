import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist');
const config=JSON.parse(await readFile('vercel.json','utf8'));
const headers=Object.fromEntries(config.headers[0].headers.map(h=>[h.key,h.value]));
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.svg':'image/svg+xml','.apk':'application/octet-stream'}[extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':mime,...headers});res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch();const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const remote=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:'))remote.push(r.url());});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.getByRole('button',{name:'Try a sample comparison'}).click();
 await page.locator('.report-card').first().waitFor();
 assert.match(await page.locator('.report-card').first().innerText(),/1\.4\.0 → 1\.5\.0/);
 assert.equal(await page.locator('#files-stat').innerText(),'7');
 await page.getByRole('button',{name:'Size breakdown',exact:true}).click();
 await page.getByRole('heading',{name:'Package size breakdown'}).waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 console.log('Production smoke passed: built JS, WASM worker, Vercel CSP, sample comparison, size view, no external requests.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
