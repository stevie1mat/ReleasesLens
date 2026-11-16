/// <reference lib="webworker" />
import type { Report } from './types';
interface Engine { memory: WebAssembly.Memory; allocate(n:number):number; release(p:number,n:number):void; compare(a:number,al:number,b:number,bl:number):bigint; }
let engine: Promise<Engine> | undefined;
function load() {
  return engine ??= fetch('/engine/releaselens.wasm').then(async response => {
    if (!response.ok) throw new Error('Comparison engine is unavailable. Run npm run build:engine, then reload.');
    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
    return instance.exports as unknown as Engine;
  });
}
self.onmessage = async (event: MessageEvent<{before:ArrayBuffer; after:ArrayBuffer}>) => {
  let api: Engine | undefined, a=0, b=0, output=0, length=0;
  const {before,after}=event.data;
  try {
    api=await load();
    a=api.allocate(before.byteLength); b=api.allocate(after.byteLength);
    new Uint8Array(api.memory.buffer,a,before.byteLength).set(new Uint8Array(before));
    new Uint8Array(api.memory.buffer,b,after.byteLength).set(new Uint8Array(after));
    const packed=api.compare(a,before.byteLength,b,after.byteLength);
    output=Number(packed >> 32n); length=Number(packed & 0xffffffffn);
    const result=JSON.parse(new TextDecoder().decode(new Uint8Array(api.memory.buffer,output,length))) as {report?:Report; error?:string};
    self.postMessage(result);
  } catch(error) { self.postMessage({error:error instanceof Error?error.message:'Could not read these archives.'}); }
  finally {
    if(api) { if(a)api.release(a,before.byteLength); if(b)api.release(b,after.byteLength); if(output)api.release(output,length); }
  }
};
