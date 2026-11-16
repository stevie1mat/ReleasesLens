import './style.css';
import type { Report, Session, Message, Change } from './types';

const icons:Record<string,string>={
 lens:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5M8 10.5h5m-2.5-2.5v5"/>',
 panels:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m6-16v16"/>',
 chat:'<path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 8h8m-8 4h5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 settings:'<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
 file:'<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 13h8m-8 4h5"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 arrow:'<path d="M12 20V4m-7 7 7-7 7 7"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 paperclip:'<path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2m-7 13 9-9"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
 chart:'<path d="M4 20h16M7 16v-5m5 5V4m5 12V8"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5m0 3h.01"/>',
 stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'
};
const icon=(name:string,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.file}</svg>`;
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<nav class="rail" aria-label="Main navigation">
 <a class="brand-mark" href="/" aria-label="ReleaseLens home">${icon('lens')}</a>
 <div class="rail-main"><button class="rail-button active" id="workspace" aria-label="Comparison workspace">${icon('panels')}</button><button class="rail-button" id="history-toggle" aria-label="View comparison history">${icon('chat')}</button><button class="rail-button" id="new-rail" aria-label="New comparison">${icon('plus')}</button></div>
 <div class="rail-bottom"><button class="rail-button" id="help" aria-label="Help and supported formats">${icon('help')}</button><button class="rail-button" id="settings" aria-label="Settings">${icon('settings')}</button><div class="avatar" aria-label="Local workspace">L</div></div>
</nav>
<aside class="sidebar" id="sidebar">
 <div class="sidebar-heading"><div><p class="eyebrow">YOUR RELEASE WORKSPACE</p><h1>A little more clarity.</h1></div><button class="quiet-button" id="new" aria-label="Start a new comparison">${icon('plus')}</button></div>
 <section class="card files-card" aria-labelledby="files-title"><div class="card-heading"><span class="small-icon">${icon('panels')}</span><h2 id="files-title">Release files</h2><span class="subtle-tag">Local only</span></div><p class="card-description">Two builds. A clearer picture.</p>
 <div class="file-slot" id="before-slot"><div class="slot-label"><span class="step">01</span><span>Previous release</span></div><button class="file-picker" id="before-pick"><span class="file-icon">${icon('file')}</span><span class="file-info"><strong id="before-name">Choose a baseline</strong><small id="before-size">APK or ZIP · up to 100 MiB</small></span>${icon('plus','pick-icon')}</button></div>
 <div class="file-connector"><span></span>${icon('chevron')}<span></span></div>
 <div class="file-slot" id="after-slot"><div class="slot-label"><span class="step">02</span><span>New release</span></div><button class="file-picker" id="after-pick"><span class="file-icon blue">${icon('file')}</span><span class="file-info"><strong id="after-name">Choose a new build</strong><small id="after-size">APK or ZIP · up to 100 MiB</small></span>${icon('plus','pick-icon')}</button></div>
 <div class="file-status" id="file-status">${icon('shield')}<span>Your files never leave this browser.</span></div>
 </section>
 <section class="card overview" aria-labelledby="overview-title"><div class="card-heading"><span class="small-icon">${icon('chart')}</span><h2 id="overview-title">At a glance</h2><span class="status-dot" id="overview-dot"></span></div><div class="overview-stats"><div><p>Package size</p><strong id="size-stat">—</strong><small id="size-caption">Waiting for two releases</small></div><div><p>Changed files</p><strong id="files-stat">—</strong><small id="files-caption">Added, removed or modified</small></div></div><div class="mini-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="overview-foot" id="overview-foot">A comparison starts with your files.</div></section>
 <section class="card history-card"><div class="card-heading">${icon('clock')}<h2>Recent comparisons</h2></div><div id="history-list"></div></section>
 <div class="sidebar-footer"><span class="engine-badge">R</span><span>Rust engine. Runs on your device.</span></div>
</aside>
<main class="workspace"><header class="topbar"><button id="mobile-menu" class="quiet-button mobile-menu" aria-label="Toggle release files" aria-expanded="false">${icon('menu')}</button><div><p class="product-name">ReleaseLens <span class="version">BETA</span></p><h2>A clearer view of every release.</h2><p class="topbar-subtitle"><span class="status-dot"></span>Private by design <span class="separator">·</span> No uploads. No account.</p></div><div class="date-block"><p id="date"></p><small id="time"></small></div></header>
 <section class="conversation" id="conversation" aria-label="Release comparison conversation" tabindex="0"><div class="welcome" id="welcome"><div class="orb" aria-hidden="true"><div class="orb-orbit orbit-one"></div><div class="orb-orbit orbit-two"></div><div class="orb-orbit orbit-three"></div><div class="orb-core">${icon('lens')}</div></div><p class="welcome-kicker">MEET YOUR NEXT RELEASE, BEFORE IT SHIPS</p><h2>Every change has a story.</h2><p class="welcome-copy">Drop in two builds. Let’s see what changed.</p><div class="suggestions"><button id="attach-suggestion" class="suggestion">${icon('upload')}Attach releases</button><button id="demo" class="suggestion">${icon('sparkle')}Try a sample comparison</button><button id="formats" class="suggestion">${icon('file')}What can I compare?</button></div><p class="welcome-note">APKs, Mac app ZIPs, and general ZIP archives.</p></div><div id="messages" class="messages" role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions"></div></section>
 <div class="composer-wrap"><div id="followups" class="followups" hidden></div><form id="composer" class="composer"><label class="sr-only" for="prompt">Ask about your releases</label><textarea id="prompt" placeholder="Ask what changed between your releases…" rows="2" maxlength="2000"></textarea><div class="composer-toolbar"><div class="engine-label"><span class="engine-badge">R</span>ReleaseLens <span class="engine-label-detail">· Local analysis</span></div><div class="composer-actions"><button type="button" id="attach" class="quiet-button" aria-label="Attach release files">${icon('paperclip')}</button><span class="on-device"><span class="status-dot"></span>On-device</span><button type="submit" id="send" class="send" aria-label="Send message">${icon('arrow')}</button><button type="button" id="cancel" class="send cancel" aria-label="Cancel analysis" hidden>${icon('stop')}</button></div></div></form><div class="composer-foot"><span>Conversations are saved locally.</span><button id="export" disabled>Export report ${icon('download')}</button></div></div>
</main><input type="file" id="before-file" accept=".apk,.zip" hidden><input type="file" id="after-file" accept=".apk,.zip" hidden><dialog id="dialog"><button class="dialog-close quiet-button" aria-label="Close dialog">${icon('close')}</button><div id="dialog-content"></div></dialog><div id="toast" class="toast" role="status" hidden></div>`;

// Keep the existing file inputs and comparison controls in a central stage.
const stage=document.createElement('section');
stage.className='release-stage';stage.setAttribute('aria-label','Release uploads and change overview');
stage.innerHTML=`<svg class="release-ring" id="release-ring" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Upload two releases to see their file changes"><defs><filter id="segment-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter><linearGradient id="ring-surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3f5fc"/><stop offset="1" stop-color="#e6ebf6"/></linearGradient></defs><circle class="ring-track" cx="250" cy="250" r="225"/><g id="ring-segments"></g></svg><div class="upload-center"><h1>Compare releases.</h1><div id="central-files"></div><button class="compare-action" id="compare-releases">Compare releases ${icon('chevron')}</button></div><div class="ring-legend" id="ring-legend" hidden></div><div class="segment-tooltip" id="segment-tooltip" role="status" hidden></div>`;
document.querySelector('.topbar')!.after(stage);
stage.querySelector('#central-files')!.append(document.querySelector('.files-card')!);
document.querySelector('.product-name')!.innerHTML='ReleaseLens';
document.querySelector('.topbar h2')!.textContent='A clearer view of every release.';
document.querySelector('.welcome h2')!.textContent='Every change has a story.';
document.querySelector('.welcome-copy')!.textContent='Explore a sample, or compare your releases above.';
document.querySelector('.sidebar-heading h1')!.textContent='Your workspace';
const chatPanel=document.createElement('section');chatPanel.className='chat-panel';chatPanel.setAttribute('aria-label','Ask about your comparison');
chatPanel.innerHTML='<header class="chat-heading"><span class="chat-status"></span><div><h2>Release chat</h2><p>Answers from your report</p></div></header>';
document.querySelector('.workspace')!.append(chatPanel);
chatPanel.append(document.querySelector('.conversation')!,document.querySelector('.composer-wrap')!);
document.querySelector('.welcome')!.insertAdjacentHTML('afterbegin','<div class="chat-welcome"><span>YOUR RELEASE, EXPLAINED</span><h2>Let’s look closer.</h2><p>Compare two builds, then ask about files,<br>permissions, libraries, or package size.</p></div>');


function el<T extends HTMLElement=HTMLElement>(id:string):T{return document.getElementById(id) as T;}
function node(tag:string,className='',value?:string){const n=document.createElement(tag);n.className=className;if(value!==undefined)n.textContent=value;return n;}
const size=(n:number)=>{if(n===0)return '0 B';const magnitude=Math.abs(n);const index=Math.min(Math.floor(Math.log(magnitude)/Math.log(1024)),3);return `${(magnitude/1024**index).toLocaleString(undefined,{maximumFractionDigits:index?1:0})} ${['B','KiB','MiB','GiB'][index]}`;};
const signed=(n:number)=>`${n>0?'+':n<0?'−':''}${size(n)}`;
let files:[File|null,File|null]=[null,null];
let report:Report|null=null;
let demoMode=false;
let busy=false;
let worker:Worker|null=null;
let rejectPending:((reason:Error)=>void)|null=null;
let generation=0;
let lastNames:string[]=[];
let messages:Message[]=[];
let sessions:Session[]=[];
let currentId:string=crypto.randomUUID();
let historyLoaded=false;
let toastTimer:ReturnType<typeof setTimeout>;
try {const saved=JSON.parse(localStorage.getItem('releaselens.sessions')||'[]');if(Array.isArray(saved))sessions=saved.filter(s=>s&&typeof s.id==='string'&&Array.isArray(s.messages)&&Array.isArray(s.names)&&typeof s.title==='string').slice(0,8);}catch{sessions=[];}
function toast(value:string){el('toast').textContent=value;el('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el('toast').hidden=true,4500);}
function save(){
 if(!messages.length)return;
 const entry:Session={id:currentId,title:lastNames[1]||'New comparison',date:new Date().toISOString(),messages:messages.slice(-40),report,names:lastNames,demo:demoMode};
 // Bound the history footprint; large reports remain usable in this session and exports.
 if(JSON.stringify(entry).length>700_000)entry.report=null;
 sessions=[entry,...sessions.filter(s=>s.id!==currentId)].slice(0,8);
 try {localStorage.setItem('releaselens.sessions',JSON.stringify(sessions));}catch {toast('Browser storage is full. This conversation is available until you close the tab.');}
 renderHistory();
}
function renderHistory(){
 const list=el('history-list');list.replaceChildren();
 if(!sessions.length){list.append(node('p','history-empty','Your comparisons will appear here.'));return;}
 for(const session of sessions){const b=node('button','history-item') as HTMLButtonElement;b.append(node('span','history-name',session.title));b.append(node('small','',new Date(session.date).toLocaleDateString(undefined,{month:'short',day:'numeric'})));b.onclick=()=>restore(session);list.append(b);}
}
function restore(s:Session){
 if(busy){toast('Cancel the current analysis before opening history.');return;}
 generation++;currentId=s.id;messages=s.messages.slice();report=s.report;lastNames=s.names.slice();demoMode=s.demo;files=[null,null];historyLoaded=true;
 renderFiles();renderMessages();updateOverview();el('sidebar').classList.remove('mobile-open');el('mobile-menu').setAttribute('aria-expanded','false');
 toast(report?'Saved comparison restored. Reattach files to run it again.':'Conversation restored. Reattach your files to compare again.');
}
function renderFiles(){
 ['before','after'].forEach((side,i)=>{
  const f=files[i];el(`${side}-name`).textContent=f?.name||(historyLoaded&&lastNames[i]?lastNames[i]+' (saved)':i?'Choose a new build':'Choose a baseline');
  el(`${side}-size`).textContent=f?`${size(f.size)} · Click to replace`:historyLoaded&&lastNames[i]?'Reattach to run again':'APK or ZIP · up to 100 MiB';
  el(`${side}-slot`).classList.toggle('has-file',!!f);
 });
 el('file-status').querySelector('span')!.textContent=files.every(Boolean)?'Both releases are ready to compare.':'Your files never leave this browser.';
}
function setFile(index:number,file:File){
 if(busy){toast('Cancel the current analysis before replacing a file.');return;}
 if(!/\.(apk|zip)$/i.test(file.name)){toast('Choose an APK or ZIP archive.');return;}
 if(file.size>100*1024*1024){toast('Choose a file smaller than 100 MiB.');return;}
 if(!file.size){toast('This file is empty. Choose a valid archive.');return;}
 // Start a separate conversation when replacing files from a completed comparison.
 if(report||historyLoaded){const previous=files.slice() as [File|null,File|null];newSession();files=previous;}
 files[index as 0|1]=file;report=null;demoMode=false;historyLoaded=false;
 lastNames=files.map(f=>f?.name||'');renderFiles();updateOverview();
 if(files.every(Boolean)) {el<HTMLTextAreaElement>('prompt').value='Compare these releases. What changed?';el<HTMLTextAreaElement>('prompt').focus();}
}
function picker(i:number){el<HTMLInputElement>(i?'after-file':'before-file').click();}
for(let i=0;i<2;i++){
 const prefix=i?'after':'before';el(prefix+'-pick').onclick=()=>picker(i);
 el<HTMLInputElement>(prefix+'-file').onchange=e=>{const input=e.target as HTMLInputElement;if(input.files?.[0])setFile(i,input.files[0]);input.value='';};
 const slot=el(prefix+'-slot');slot.ondragover=e=>{e.preventDefault();slot.classList.add('drag-over');};slot.ondragleave=()=>slot.classList.remove('drag-over');slot.ondrop=e=>{e.preventDefault();slot.classList.remove('drag-over');const file=e.dataTransfer?.files[0];if(file)setFile(i,file);};
}
function attach(){picker(files[0]?1:0);}
el('compare-releases').onclick=()=>submit('Compare these releases. What changed?');
el('attach').onclick=attach;el('attach-suggestion').onclick=attach;
function addMessage(message:Message){messages.push(message);el('welcome').hidden=true;renderMessage(message);scrollChat();save();}
function scrollChat(){requestAnimationFrame(()=>el('conversation').scrollTo({top:el('conversation').scrollHeight,behavior:'smooth'}));}
function renderMessages(){el('messages').replaceChildren();el('welcome').hidden=messages.length>0;messages.forEach(renderMessage);scrollChat();}
function renderMessage(message:Message){
 const article=node('article',`message ${message.role}`);
 const byline=node('div','message-byline');const mark=node('span','message-avatar');mark.innerHTML=message.role==='assistant'?icon('lens'):icon('chat');byline.append(mark,node('span','',message.role==='assistant'?'ReleaseLens':'You'));article.append(byline);
 const content=node('div','message-content');content.append(node('p','message-text',message.text));
 if(message.view&&report){
  if(message.view==='summary')renderSummary(content,report);
  if(message.view==='permissions')renderPermissions(content,report);
  if(message.view==='size')renderSize(content,report);
  if(message.view==='files')renderFilesTable(content,report.changes);
 }
 article.append(content);el('messages').append(article);
}
function stat(parent:HTMLElement,label:string,value:string){const box=node('div','report-stat');box.append(node('strong','',value),node('span','',label));parent.append(box);}
function renderSummary(parent:HTMLElement,r:Report){
 const card=node('section','report-card');
 const header=node('div','report-heading');header.append(node('span','report-title',`${r.before.metadata.version||'Previous build'} → ${r.after.metadata.version||'New build'}`),node('span','subtle-tag',demoMode?'SAMPLE FILES':r.after.kind));card.append(header);
 const identity=r.after.metadata.package;if(identity)card.append(node('p','report-identity',identity));
 const stats=node('div','report-stats');stat(stats,'Package size',signed(r.delta));stat(stats,'Added',String(r.added));stat(stats,'Modified',String(r.modified));stat(stats,'Removed',String(r.removed));card.append(stats);
 card.append(node('p','report-note',`${r.unchanged.toLocaleString()} files unchanged. File contents verified with SHA-256.`));
 const permissions=r.permissions_added.length;const warning=node('div',permissions?'finding amber':'finding');warning.innerHTML=icon(permissions?'shield':'check');warning.append(node('span','',permissions?`${permissions} new declared permission${permissions===1?'':'s'} to review.`:r.after.kind==='Android APK'?'No new declared permissions detected.':'Archive comparison complete.'));card.append(warning);
 for(const warningText of [...r.before.warnings,...r.after.warnings])card.append(node('p','warning-text',warningText));
 card.append(node('p','report-note','This is a package comparison, not a security audit or a behavioral test.'));
 parent.append(card);
 if(r.changes.length){parent.append(node('h3','section-title','Largest file changes'));renderFilesTable(parent,r.changes.slice(0,5),true);}
}
function renderPermissions(parent:HTMLElement,r:Report){
 if(r.after.kind!=='Android APK'){parent.append(node('p','report-note','Declared Android permissions are available for APK comparisons. Mac entitlements are not analyzed in this version.'));return;}
 const wrap=node('div','permission-list');
 if(r.before.warnings.length||r.after.warnings.length)wrap.append(node('p','warning-text','Manifest parsing reported a warning. These permission results may be incomplete.'));
 for(const [label,permissions] of [['Added',r.permissions_added],['Removed',r.permissions_removed],['Unchanged',r.after.metadata.permissions.filter(p=>r.before.metadata.permissions.includes(p))]] as [string,string[]][]){
  const group=node('section','permission-group');group.append(node('h3','section-title',label));
  if(!permissions.length)group.append(node('p','report-note','None detected.'));
  permissions.forEach(p=>group.append(node('code',label==='Added'?'permission added':'permission',p)));wrap.append(group);
 }
 wrap.append(node('p','report-note',`Target SDK: ${r.before.metadata.target_sdk||'not declared'} → ${r.after.metadata.target_sdk||'not declared'}. A declaration does not mean a permission is granted.`));parent.append(wrap);
}
function renderSize(parent:HTMLElement,r:Report){
 const wrap=node('section','report-card');wrap.append(node('h3','section-title','Package size breakdown'));
 const max=Math.max(r.before.bytes,r.after.bytes,1);
 for(const [label,n] of [['Previous release',r.before.bytes],['New release',r.after.bytes]] as [string,number][]){const row=node('div','size-row');row.append(node('span','',label),node('strong','',size(n)));const track=node('div','size-track');const bar=node('div','size-bar');bar.style.width=`${n/max*100}%`;track.append(bar);wrap.append(row,track);}
 wrap.append(node('p','report-note',`Download size changed by ${signed(r.delta)}. Expanded file contents: ${size(r.before.expanded)} → ${size(r.after.expanded)}. ZIP compression and signatures can affect download size independently of file content.`));parent.append(wrap);renderFilesTable(parent,r.changes.slice(0,10),true);
}
function renderFilesTable(parent:HTMLElement,changes:Change[],compact=false){
 const wrap=node('div','file-changes');let filter='all',query='',limit=20;
 const container=node('div','change-rows');
 function update(){
  container.replaceChildren();const filtered=changes.filter(c=>(filter==='all'||c.status===filter)&&c.path.toLowerCase().includes(query));
  for(const c of filtered.slice(0,compact?10:limit)){const row=node('div','change-row');row.append(node('span',`change-status ${c.status}`,c.status),node('code','change-path',c.path),node('span','change-delta',signed(c.delta)));container.append(row);}
  if(!filtered.length)container.append(node('p','report-note','No matching file changes.'));
  if(!compact&&filtered.length>limit){const more=node('button','text-button',`Show more (${filtered.length-limit} remaining)`) as HTMLButtonElement;more.onclick=()=>{limit+=50;update();};container.append(more);}
 }
 if(!compact){const controls=node('div','file-filters');const search=document.createElement('input');search.placeholder='Filter file paths…';search.setAttribute('aria-label','Filter file paths');search.oninput=()=>{query=search.value.toLowerCase();limit=20;update();};const select=document.createElement('select');select.setAttribute('aria-label','Filter change type');for(const name of ['all','added','modified','removed']){const option=document.createElement('option');option.value=name;option.textContent=name[0].toUpperCase()+name.slice(1);select.append(option);}select.onchange=()=>{filter=select.value;limit=20;update();};controls.append(search,select);wrap.append(controls);}
 wrap.append(container);update();parent.append(wrap);
}
function renderReleaseRing(){
 const svg=document.getElementById('release-ring')!;
 const segments=document.getElementById('ring-segments')!;
 const legend=el('ring-legend');segments.replaceChildren();legend.replaceChildren();legend.hidden=true;el('segment-tooltip').hidden=true;
 if(!report){svg.setAttribute('aria-label','Upload two releases to see their file changes');return;}
 const descriptions:string[]=[];
 const sides=[
  {label:'Previous release · left',start:90,total:report.before.files,values:[['Removed',report.removed,'removed'],['Modified',report.modified,'modified'],['Unchanged',report.unchanged,'unchanged']]},
  {label:'New release · right',start:-90,total:report.after.files,values:[['Added',report.added,'added'],['Modified',report.modified,'modified'],['Unchanged',report.unchanged,'unchanged']]}
 ];
 const point=(angle:number)=>{const radians=angle*Math.PI/180;return `${250+225*Math.cos(radians)} ${250+225*Math.sin(radians)}`;};
 for(const side of sides){
  const group=node('div','legend-half');group.append(node('h3','',side.label));
  let angle=side.start;
  for(const [label,count,kind] of side.values as [string,number,string][]){
   const fraction=side.total?count/side.total:0;
   const percent=`${(fraction*100).toLocaleString(undefined,{maximumFractionDigits:1})}%`;
   const text=`${label}: ${percent} (${count} files)`;
   descriptions.push(`${side.label}, ${text}`);
   const item=node('div',`legend-item ${kind}`);item.append(node('i'),node('span','',label),node('strong','',percent));item.title=text;group.append(item);
   if(count&&side.total){
    const sweep=fraction*180;const gap=Math.min(1.4,sweep*.15);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',`M ${point(angle+gap/2)} A 225 225 0 0 1 ${point(angle+sweep-gap/2)}`);
    path.setAttribute('class',`ring-segment ${kind}`);path.setAttribute('data-side',side.start===90?'before':'after');
    path.setAttribute('data-percent',String(fraction*100));
    path.setAttribute('tabindex','0');path.setAttribute('role','img');path.setAttribute('aria-label',`${side.label}, ${text}`);
    const positionDetails=(x:number,y:number)=>{
     const tooltip=el('segment-tooltip');const bounds=tooltip.getBoundingClientRect();
     tooltip.style.left=`${Math.max(8,Math.min(x+14,window.innerWidth-bounds.width-8))}px`;
     tooltip.style.top=`${Math.max(8,Math.min(y+14,window.innerHeight-bounds.height-8))}px`;
    };
    const showDetails=()=>{const tooltip=el('segment-tooltip');tooltip.textContent=`${side.label.split(' · ')[0]} · ${label}: ${percent} (${count} ${count===1?'file':'files'})`;tooltip.hidden=false;};
    const hideDetails=()=>{el('segment-tooltip').hidden=true;};
    path.addEventListener('pointerenter',event=>{showDetails();positionDetails(event.clientX,event.clientY);});
    path.addEventListener('pointermove',event=>positionDetails(event.clientX,event.clientY));
    path.addEventListener('pointerleave',hideDetails);
    path.addEventListener('focus',()=>{showDetails();const bounds=path.getBoundingClientRect();positionDetails(bounds.x+bounds.width/2,bounds.y+bounds.height/2);});
    path.addEventListener('blur',hideDetails);
    path.addEventListener('keydown',event=>{if(event.key==='Escape')hideDetails();});
    const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=`${side.label}, ${text}`;path.append(title);
    if(kind!=='unchanged'){const glow=path.cloneNode(true) as SVGPathElement;glow.removeAttribute('tabindex');glow.removeAttribute('role');glow.setAttribute('class',`ring-glow ${kind}`);glow.setAttribute('filter','url(#segment-glow)');glow.setAttribute('aria-hidden','true');segments.append(glow);}
    segments.append(path);angle+=sweep;
   }
  }
  if(!side.total)group.append(node('p','legend-empty','No files in this release.'));
  legend.append(group);
 }
 svg.setAttribute('aria-label',descriptions.join('. '));
}
function updateOverview(){
 renderReleaseRing();
 el<HTMLButtonElement>('compare-releases').disabled=busy||!files.every(Boolean);
 el('compare-releases').firstChild!.textContent=busy?'Comparing… ':report?'Compare again ':'Compare releases ';

 el('size-stat').textContent=report?signed(report.delta):'—';el('files-stat').textContent=report?String(report.added+report.removed+report.modified):'—';
 el('size-caption').textContent=report?`${size(report.before.bytes)} → ${size(report.after.bytes)}`:'Waiting for two releases';
 el('files-caption').textContent=report?`${report.unchanged} unchanged`:'Added, removed or modified';
 el('overview-foot').textContent=report?demoMode?'Sample comparison · actual fixture files':'Compared locally · SHA-256 verified':busy?'Reading and comparing file contents…':'A comparison starts with your files.';
 el('overview-dot').classList.toggle('ready',!!report);el('export').toggleAttribute('disabled',!report);
 const bars=document.querySelectorAll<HTMLElement>('.mini-bars i');
 const deltas=report?.changes.slice(0,12).map(c=>Math.abs(c.delta))||[];
 const largest=Math.max(...deltas,1);
 bars.forEach((bar,i)=>{bar.style.height=report&&deltas[i]!==undefined?`${Math.max(2,Math.round(deltas[i]/largest*25))}px`:'2px';});
 el('followups').replaceChildren();el('followups').hidden=!report;
 if(report)for(const [label,text] of [['Permissions','Which permissions changed?'],['File changes','Show all changed files'],['Size breakdown','Why did the package size change?']]){const b=node('button','followup',label) as HTMLButtonElement;b.onclick=()=>submit(text);el('followups').append(b);}
}
function setBusy(value:boolean){busy=value;el('send').hidden=value;el('cancel').hidden=!value;el<HTMLTextAreaElement>('prompt').disabled=value;el('composer').classList.toggle('analyzing',value);for(const id of ['before-pick','after-pick','demo'])el<HTMLButtonElement>(id).disabled=value;updateOverview();}
async function compare(prompt:string){
 if(!files.every(Boolean)){addMessage({role:'assistant',text:'Attach a previous release and a new release using the upload controls on the left. I can compare two APKs, two Mac app ZIPs, or two general ZIPs.'});return;}
 const token=++generation;setBusy(true);const start=performance.now();
 try {
  const [before,after]=await Promise.all(files.map(f=>f!.arrayBuffer()));
  if(token!==generation)return;
  worker=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
  const result=await new Promise<{report?:Report;error?:string}>((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Analysis took longer than 90 seconds. Try smaller archives.')),90_000);
   rejectPending=(reason)=>{clearTimeout(timer);reject(reason);};
   worker!.onmessage=e=>{clearTimeout(timer);resolve(e.data);};worker!.onerror=()=>{clearTimeout(timer);reject(new Error('The comparison engine could not finish. Try smaller files or check that the WASM engine is built.'));};
   worker!.postMessage({before,after},[before,after]);
  });
  if(token!==generation)return;
  if(result.error)throw new Error(result.error);
  if(!result.report)throw new Error('The comparison returned no report.');
  report=result.report;setBusy(false);
  addMessage({role:'assistant',text:`${demoMode?'Here’s a comparison of the included sample builds.':'Your comparison is ready.'} I checked ${report.before.files.toLocaleString()} files in the previous build and ${report.after.files.toLocaleString()} in the new build, entirely on your device.`,view:'summary'});
  if(!/compare|changed|difference|release/i.test(prompt)||/permission|size|librar|framework|sdk/i.test(prompt))answer(prompt);
  toast(`Comparison completed in ${((performance.now()-start)/1000).toFixed(1)}s.`);
 }catch(error){if(token===generation){setBusy(false);addMessage({role:'assistant',text:error instanceof Error?error.message:'Could not compare these archives.'});}}
 finally {if(token===generation){worker?.terminate();worker=null;rejectPending=null;}}
}
function answer(prompt:string){
 if(!report)return;
 const q=prompt.toLowerCase();
 if(/permission|sdk/.test(q)){addMessage({role:'assistant',text:`I found ${report.permissions_added.length} added and ${report.permissions_removed.length} removed declared permissions.`,view:'permissions'});}
 else if(/size|large|grow|bloat|weight|smaller/.test(q)){addMessage({role:'assistant',text:`The package ${report.delta>0?'grew':report.delta<0?'shrank':'size stayed the same'}${report.delta?` by ${size(report.delta)}`:''}. Here’s the size comparison and the largest file-level changes.`,view:'size'});}
 else if(/librar|framework|dependenc/.test(q)){
  const added=report.libraries_added.length?report.libraries_added.join('\n'):'None detected.';const removed=report.libraries_removed.length?report.libraries_removed.join('\n'):'None detected.';
  addMessage({role:'assistant',text:`Native libraries and bundled frameworks added:\n${added}\n\nRemoved:\n${removed}\n\nThese are archive paths, not a complete dependency inventory. Java/Kotlin dependencies inside DEX files and library versions are not resolved.`});
 }
 else if(/file|asset|resource|added|removed|modified/.test(q)){addMessage({role:'assistant',text:`${report.added} files added, ${report.removed} removed, and ${report.modified} modified. Search a path or filter by change type below.`,view:'files'});}
 else if(/safe|security|malware|vulnerab/.test(q)){addMessage({role:'assistant',text:'I can explain package changes, but cannot determine whether an app is safe. This version does not scan for malware, verify signing certificates, or test runtime behavior. Review new permissions and native libraries as useful starting points.',view:'permissions'});}
 else if(/summary|compare|change|difference|release/.test(q)){addMessage({role:'assistant',text:'Here’s the release summary. Ask about permissions, package size, changed files, SDK levels, or native libraries to look closer.',view:'summary'});}
 else{addMessage({role:'assistant',text:'I answer questions from the package comparison without a language model. Try “Which permissions changed?”, “Show changed files”, “Why did the package grow?”, or “Which native libraries were added?”'});}
}
function submit(value?:string){
 if(busy)return;
 const input=el<HTMLTextAreaElement>('prompt');const prompt=(value??input.value).trim();if(!prompt)return;
 input.value='';addMessage({role:'user',text:prompt});
 if(report)answer(prompt);else void compare(prompt);
}
el<HTMLFormElement>('composer').onsubmit=e=>{e.preventDefault();submit();};
el<HTMLTextAreaElement>('prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit();}};
function cancel(){generation++;worker?.terminate();worker=null;rejectPending?.(new Error('Canceled'));rejectPending=null;setBusy(false);addMessage({role:'assistant',text:'Analysis canceled. Your selected files are still available when you’re ready to try again.'});}
el('cancel').onclick=cancel;
function newSession(){if(busy){generation++;worker?.terminate();worker=null;rejectPending?.(new Error('Canceled'));rejectPending=null;setBusy(false);}save();currentId=crypto.randomUUID();files=[null,null];report=null;messages=[];lastNames=[];demoMode=false;historyLoaded=false;el<HTMLTextAreaElement>('prompt').value='';renderFiles();renderMessages();updateOverview();}
el('new').onclick=newSession;el('new-rail').onclick=newSession;
el('workspace').onclick=()=>{el('sidebar').classList.remove('mobile-open');el('mobile-menu').setAttribute('aria-expanded','false');el('conversation').focus();};
el('history-toggle').onclick=()=>{const open=el('sidebar').classList.toggle('mobile-open');el('mobile-menu').setAttribute('aria-expanded',String(open));if(open)document.querySelector('.history-card')!.scrollIntoView({behavior:'smooth',block:'nearest'});};
el('mobile-menu').onclick=()=>{const open=el('sidebar').classList.toggle('mobile-open');el('mobile-menu').setAttribute('aria-expanded',String(open));};
el('demo').onclick=async()=>{
 if(busy)return;newSession();setBusy(true);const token=++generation;
 try {
  const [a,b]=await Promise.all(['before','after'].map(async name=>{const response=await fetch(`/examples/sample-${name}.apk`);if(!response.ok)throw new Error('Sample files are unavailable.');return new File([await response.blob()],`sample-${name}.apk`);}));
  if(token!==generation)return;
  files=[a,b];lastNames=[a.name,b.name];demoMode=true;renderFiles();setBusy(false);submit('Compare the included sample releases.');
 }catch(e){if(token===generation){setBusy(false);toast(e instanceof Error?e.message:'Could not load sample files.');}}
};
function dialog(title:string,body:string){el('dialog-content').replaceChildren();el('dialog-content').append(node('h2','',title),node('p','dialog-copy',body));el<HTMLDialogElement>('dialog').showModal();}
el('dialog').querySelector<HTMLButtonElement>('.dialog-close')!.onclick=()=>el<HTMLDialogElement>('dialog').close();
el<HTMLDialogElement>('dialog').onclick=e=>{if(e.target===el('dialog'))el<HTMLDialogElement>('dialog').close();};
function help(){dialog('A closer look at your releases.','Attach two APKs, two ZIP files containing a single Mac .app, or two general ZIP archives. ReleaseLens compares file contents with SHA-256, sizes, declared Android permissions, SDK levels, and bundled native-library paths. APK binary manifests and XML/binary Info.plist files are supported.\n\nLimits: 100 MiB per archive, 512 MiB expanded per archive, 128 MiB per entry, and 20,000 entries. Encrypted archives, AABs, IPAs, DMGs, and signature verification are not supported. Files are read, never executed or uploaded.\n\nChat uses local, predefined question handling rather than an AI model. Reports describe package differences; they cannot establish safety or explain source-code behavior.');}
el('help').onclick=help;el('formats').onclick=help;
el('settings').onclick=()=>{
 dialog('Your local workspace.','Comparisons run in a background worker on this device. The last eight conversations and their reports are saved in this browser. Uploaded app files are never stored in conversation history.');
 const label=node('label','setting-row');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=localStorage.getItem('releaselens.motion')==='reduced';checkbox.onchange=()=>{document.documentElement.classList.toggle('reduce-motion',checkbox.checked);try{localStorage.setItem('releaselens.motion',checkbox.checked?'reduced':'normal');}catch{}};label.append(checkbox,node('span','','Reduce decorative motion'));el('dialog-content').append(label);
 const clear=node('button','danger-button','Clear saved conversations') as HTMLButtonElement;clear.onclick=()=>{try{localStorage.removeItem('releaselens.sessions');}catch{}sessions=[];renderHistory();toast('Saved conversations cleared.');el<HTMLDialogElement>('dialog').close();};el('dialog-content').append(clear);
};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function download(kind:'json'|'html'){
 if(!report)return;
 const data={application:'ReleaseLens',version:'0.1.0',sample:demoMode,files:lastNames,generatedAt:new Date().toISOString(),report};
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ReleaseLens report</title><style>body{font:15px system-ui;color:#243141;max-width:1000px;margin:48px auto;padding:24px}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:10px;border-bottom:1px solid #dfe7ef;overflow-wrap:anywhere}code{font-size:12px}small{color:#63758b}</style><h1>ReleaseLens comparison${demoMode?' · Sample':''}</h1><p>${lastNames.map(escape).join(' → ')}</p><p>Package size: ${escape(size(report.before.bytes))} → ${escape(size(report.after.bytes))} (${escape(signed(report.delta))})</p><p>${report.added} added · ${report.modified} modified · ${report.removed} removed · ${report.unchanged} unchanged</p><h2>Declared permission changes</h2><p>Added: ${escape(report.permissions_added.join(', ')||'None detected')}</p><p>Removed: ${escape(report.permissions_removed.join(', ')||'None detected')}</p>${[...report.before.warnings,...report.after.warnings].map(w=>`<p>${escape(w)}</p>`).join('')}<h2>Native-library path changes</h2><p>Added: ${escape(report.libraries_added.join(', ')||'None detected')}</p><p>Removed: ${escape(report.libraries_removed.join(', ')||'None detected')}</p><h2>File changes</h2><table><thead><tr><th>Path</th><th>Change</th><th>Expanded size delta</th></tr></thead><tbody>${report.changes.map(c=>`<tr><td><code>${escape(c.path)}</code></td><td>${c.status}</td><td>${escape(signed(c.delta))}</td></tr>`).join('')}</tbody></table><p><small>Compared locally using SHA-256. Not a security audit. Signing certificates, runtime behavior, and complete dependency versions are not checked.</small></p></html>`;
 const url=URL.createObjectURL(new Blob([kind==='json'?JSON.stringify(data,null,2):html],{type:kind==='json'?'application/json':'text/html'}));const a=document.createElement('a');a.href=url;a.download=`releaselens-report.${kind}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
el('export').onclick=()=>{dialog('Take the details with you.','Download the current comparison. Reports include file paths, permission changes, and package sizes, but never the app binaries.');for(const kind of ['html','json'] as const){const b=node('button','export-option',`Download ${kind.toUpperCase()} report`) as HTMLButtonElement;b.onclick=()=>{download(kind);el<HTMLDialogElement>('dialog').close();};el('dialog-content').append(b);}};
function updateDate(){const now=new Date();el('date').textContent=now.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});el('time').textContent=now.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',timeZoneName:'short'});}
try{document.documentElement.classList.toggle('reduce-motion',localStorage.getItem('releaselens.motion')==='reduced');}catch{}
updateDate();setInterval(updateDate,60_000);renderHistory();updateOverview();
