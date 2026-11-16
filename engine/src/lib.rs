use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{collections::{BTreeMap, BTreeSet}, io::{Cursor, Read}};

const MAX_INPUT: usize = 100 * 1024 * 1024;
const MAX_EXPANDED: u64 = 512 * 1024 * 1024;
const MAX_FILES: usize = 20_000;
const MAX_METADATA: u64 = 4 * 1024 * 1024;

#[derive(Default, Serialize, Debug)]
pub struct Metadata {
    package: Option<String>, version: Option<String>, build: Option<String>,
    min_sdk: Option<String>, target_sdk: Option<String>, permissions: BTreeSet<String>,
}
#[derive(Serialize, Debug)]
pub struct Archive {
    kind: String, bytes: usize, expanded: u64, files: usize, metadata: Metadata,
    libraries: BTreeSet<String>, warnings: Vec<String>,
    #[serde(skip)] entries: BTreeMap<String, Entry>,
}
#[derive(Debug)]
struct Entry { size: u64, hash: String }
#[derive(Serialize, Debug)]
pub struct Change { path: String, status: String, before: u64, after: u64, delta: i64 }
#[derive(Serialize, Debug)]
pub struct Report {
    before: Archive, after: Archive, added: usize, removed: usize, modified: usize,
    unchanged: usize, delta: i64, permissions_added: Vec<String>, permissions_removed: Vec<String>,
    libraries_added: Vec<String>, libraries_removed: Vec<String>, changes: Vec<Change>,
}

fn inspect(bytes: &[u8]) -> Result<Archive,String> {
    if bytes.len() > MAX_INPUT { return Err("Each archive must be 100 MiB or smaller.".into()); }
    let mut zip=zip::ZipArchive::new(Cursor::new(bytes)).map_err(|_| "This is not a readable ZIP or APK archive. Encrypted and multipart archives are not supported.")?;
    if zip.len()>MAX_FILES { return Err("Archive contains more than 20,000 entries.".into()); }
    let names:Vec<String>=(0..zip.len()).map(|i|zip.by_index(i).map(|f|f.name().to_owned()).map_err(|_|"Could not read ZIP entry.".to_string())).collect::<Result<_,_>>()?;
    let apk=names.iter().any(|n|n=="AndroidManifest.xml");
    let roots:BTreeSet<String>=names.iter().filter_map(|n|n.find(".app/Contents/").map(|i|n[..i+5].to_string())).filter(|n|!n.starts_with("__MACOSX/")).collect();
    let mac_root=if !apk && roots.len()==1 { roots.iter().next().cloned() } else { None };
    let kind=if apk {"Android APK"} else if mac_root.is_some() {"Mac app ZIP"} else {"ZIP archive"};
    let mut archive=Archive { kind:kind.into(),bytes:bytes.len(),expanded:0,files:0,metadata:Metadata::default(),libraries:BTreeSet::new(),warnings:vec![],entries:BTreeMap::new() };
    if !apk && roots.len()>1 { archive.warnings.push("Multiple Mac apps found; comparing the ZIP as a generic archive.".into()); }
    let mut metadata_bytes=None;
    let mut buffer=[0u8;65536];
    let mut actual_total=0u64;
    for i in 0..zip.len() {
        let mut file=zip.by_index(i).map_err(|e|format!("Unsupported ZIP entry: {e}"))?;
        let raw=file.name().to_string();
        if file.is_dir() { continue; }
        // Nothing is extracted. Reject ambiguous or traversal-style names nonetheless.
        if raw.starts_with('/') || raw.contains('\\') || raw.split('/').any(|p|p=="..") || raw.contains('\0') { return Err("Archive contains an unsafe or ambiguous file path.".into()); }
        if raw.starts_with("__MACOSX/") || raw==".DS_Store" || raw.ends_with("/.DS_Store") { continue; }
        archive.expanded=archive.expanded.checked_add(file.size()).ok_or("Archive size overflow.")?;
        if archive.expanded>MAX_EXPANDED || file.size()>128*1024*1024 { return Err("Archive exceeds the safety limit: 512 MiB expanded, 128 MiB per entry.".into()); }
        let path=if let Some(root)=&mac_root { raw.strip_prefix(root).unwrap_or(&raw).to_string() } else {raw.clone()};
        if archive.entries.contains_key(&path) { return Err("Archive contains duplicate file paths.".into()); }
        let is_metadata=(apk && path=="AndroidManifest.xml") || (mac_root.is_some() && path=="Contents/Info.plist");
        if is_metadata && file.size()>MAX_METADATA { return Err("App metadata is unexpectedly large (over 4 MiB).".into()); }
        let mut collected=Vec::new();
        let mut hash=Sha256::new(); let mut actual=0u64;
        loop {
            let count=file.read(&mut buffer).map_err(|_|format!("Could not decompress or verify {path}."))?;
            if count==0 {break;}
            actual+=count as u64; actual_total+=count as u64;
            if actual>128*1024*1024 || actual_total>MAX_EXPANDED || (is_metadata && actual>MAX_METADATA) {return Err("Decompressed data exceeds archive safety limits.".into());}
            hash.update(&buffer[..count]); if is_metadata {collected.extend_from_slice(&buffer[..count]);}
        }
        if actual!=file.size() {return Err(format!("Size mismatch in {path}."));}
        if is_metadata {metadata_bytes=Some(collected);}
        if (apk && path.starts_with("lib/") && path.ends_with(".so")) || (mac_root.is_some() && (path.contains(".framework/") && path.ends_with("/Info.plist") || path.ends_with(".dylib"))) {
            let name=if path.contains(".framework/") {path.split(".framework/").next().unwrap().to_owned()+".framework"} else {path.clone()};
            archive.libraries.insert(name);
        }
        archive.entries.insert(path,Entry {size:actual,hash:format!("{:x}",hash.finalize())});
    }
    archive.files=archive.entries.len();
    if let Some(data)=metadata_bytes {
        let result=if apk { parse_manifest(&data) } else {parse_plist(&data)};
        match result {Ok(m)=>archive.metadata=m,Err(e)=>archive.warnings.push(format!("Metadata unavailable: {e}. Permission results are incomplete."))}
    } else if apk || mac_root.is_some() {archive.warnings.push("App metadata file not found.".into());}
    Ok(archive)
}

pub fn compare_archives(before:&[u8], after:&[u8])->Result<Report,String> {
    let old=inspect(before)?; let new=inspect(after)?;
    if old.kind!=new.kind {return Err("Choose two releases of the same archive type (two APKs, two Mac app ZIPs, or two generic ZIPs).".into());}
    if let (Some(a),Some(b))=(&old.metadata.package,&new.metadata.package) {if a!=b {return Err("These releases have different app identifiers. Choose two versions of the same app.".into());}}
    let mut changes=vec![];let(mut added,mut removed,mut modified,mut unchanged)=(0,0,0,0);
    let paths:BTreeSet<&String>=old.entries.keys().chain(new.entries.keys()).collect();
    for path in paths {
        let (status,before,after)=match (old.entries.get(path),new.entries.get(path)) {
            (None,Some(b))=>{added+=1;("added",0,b.size)},
            (Some(a),None)=>{removed+=1;("removed",a.size,0)},
            (Some(a),Some(b)) if a.hash!=b.hash=>{modified+=1;("modified",a.size,b.size)},
            _=>{unchanged+=1;continue;}
        };
        changes.push(Change{path:path.clone(),status:status.into(),before,after,delta:after as i64-before as i64});
    }
    changes.sort_by(|a,b|b.delta.unsigned_abs().cmp(&a.delta.unsigned_abs()).then(a.path.cmp(&b.path)));
    Ok(Report {
        delta:new.bytes as i64-old.bytes as i64,
        permissions_added:new.metadata.permissions.difference(&old.metadata.permissions).cloned().collect(),
        permissions_removed:old.metadata.permissions.difference(&new.metadata.permissions).cloned().collect(),
        libraries_added:new.libraries.difference(&old.libraries).cloned().collect(),
        libraries_removed:old.libraries.difference(&new.libraries).cloned().collect(),
        before:old,after:new,added,removed,modified,unchanged,changes,
    })
}

fn apply_element(m:&mut Metadata, name:&str, attrs:&BTreeMap<String,String>) {
    let get=|key:&str| attrs.get(key).cloned().filter(|s|!s.is_empty());
    match name {
        "manifest"=>{m.package=get("package");m.version=get("versionName");m.build=get("versionCode");},
        "uses-sdk"=>{m.min_sdk=get("minSdkVersion");m.target_sdk=get("targetSdkVersion");},
        "uses-permission"|"uses-permission-sdk-23"|"uses-permission-sdk-m"=>{if let Some(p)=get("name"){m.permissions.insert(p);}},
        _=>{}
    }
}
fn parse_manifest(bytes:&[u8])->Result<Metadata,String> {
    if bytes.starts_with(&[3,0]) {return parse_axml(bytes);}
    let mut reader=quick_xml::Reader::from_reader(bytes);reader.config_mut().trim_text(true);
    let mut m=Metadata::default();let mut manifest=false;
    loop {
        match reader.read_event().map_err(|_|"Invalid manifest XML")? {
            quick_xml::events::Event::Start(e)|quick_xml::events::Event::Empty(e)=>{
                let name=String::from_utf8_lossy(e.local_name().as_ref()).into_owned();if name=="manifest" {manifest=true;}
                let mut attrs=BTreeMap::new();
                for a in e.attributes() {let a=a.map_err(|_|"Invalid manifest attribute")?;let key=String::from_utf8_lossy(a.key.local_name().as_ref()).into_owned();let value=a.decode_and_unescape_value(reader.decoder()).map_err(|_|"Invalid manifest value")?.into_owned();attrs.insert(key,value);}
                apply_element(&mut m,&name,&attrs);
            },
            quick_xml::events::Event::Eof=>break,_=>{}
        }
    }
    if !manifest {return Err("No manifest element".into());} Ok(m)
}
fn u16_at(b:&[u8],p:usize)->Result<u16,String> {let s=b.get(p..p.checked_add(2).ok_or("Offset overflow")?).ok_or("Truncated binary XML")?;Ok(u16::from_le_bytes([s[0],s[1]]))}
fn u32_at(b:&[u8],p:usize)->Result<u32,String> {let s=b.get(p..p.checked_add(4).ok_or("Offset overflow")?).ok_or("Truncated binary XML")?;Ok(u32::from_le_bytes([s[0],s[1],s[2],s[3]]))}
fn len8(b:&[u8],p:&mut usize)->Result<usize,String> {let a=*b.get(*p).ok_or("Truncated string")?;*p+=1;if a&128==0 {Ok(a as usize)}else{let c=*b.get(*p).ok_or("Truncated string")?;*p+=1;Ok((((a&127) as usize)<<8)|c as usize)}}
fn len16(b:&[u8],p:&mut usize)->Result<usize,String> {let a=u16_at(b,*p)?;*p+=2;if a&0x8000==0 {Ok(a as usize)}else{let c=u16_at(b,*p)?;*p+=2;Ok((((a&0x7fff) as usize)<<16)|c as usize)}}
fn parse_pool(b:&[u8])->Result<Vec<String>,String> {
    let count=u32_at(b,8)? as usize; let flags=u32_at(b,16)?;let start=u32_at(b,20)? as usize;let header=u16_at(b,2)? as usize;
    if count>100_000 {return Err("Too many manifest strings".into());}
    let mut strings=Vec::with_capacity(count);
    for i in 0..count {
        let offset=u32_at(b,header+i*4)? as usize;let mut p=start.checked_add(offset).ok_or("String offset overflow")?;
        let s=if flags&256!=0 {let _=len8(b,&mut p)?;let len=len8(b,&mut p)?;String::from_utf8(b.get(p..p.checked_add(len).ok_or("String overflow")?).ok_or("Truncated string")?.to_vec()).map_err(|_|"Invalid UTF-8")?}
        else {let len=len16(b,&mut p)?;let end=p.checked_add(len.checked_mul(2).ok_or("String overflow")?).ok_or("String overflow")?;let slice=b.get(p..end).ok_or("Truncated string")?;String::from_utf16(&slice.chunks_exact(2).map(|x|u16::from_le_bytes([x[0],x[1]])).collect::<Vec<_>>()).map_err(|_|"Invalid UTF-16")?};
        strings.push(s);
    } Ok(strings)
}
fn parse_axml(b:&[u8])->Result<Metadata,String> {
    let total=u32_at(b,4)? as usize;if total>b.len() || total<8 {return Err("Invalid binary XML size".into());}
    let mut offset=u16_at(b,2)? as usize;if offset<8 {return Err("Invalid XML header".into());}
    let mut strings=vec![];let mut m=Metadata::default();let mut manifest=false;
    while offset<total {
        let kind=u16_at(b,offset)?;let header=u16_at(b,offset+2)? as usize;let size=u32_at(b,offset+4)? as usize;
        if size<8 || header<8 || header>size || size>total-offset {return Err("Invalid binary XML chunk".into());}
        let chunk=&b[offset..offset+size];
        if kind==1 {strings=parse_pool(chunk)?;}
        if kind==0x102 {
            let idx=u32_at(chunk,header+4)? as usize;let name=strings.get(idx).ok_or("Invalid element string")?;
            if name=="manifest" {manifest=true;}
            let start=u16_at(chunk,header+8)? as usize;let stride=u16_at(chunk,header+10)? as usize;let count=u16_at(chunk,header+12)? as usize;
            if stride<20 || start<20 || count>10000 {return Err("Invalid binary XML attributes".into());}
            let mut attrs=BTreeMap::new();
            for i in 0..count {
                let p=header+start+i*stride;
                let key=strings.get(u32_at(chunk,p+4)? as usize).ok_or("Invalid attribute name")?.clone();
                let raw=u32_at(chunk,p+8)?;let dtype=*chunk.get(p+15).ok_or("Invalid attribute")?;let data=u32_at(chunk,p+16)?;
                let value=if raw!=u32::MAX {strings.get(raw as usize).cloned().ok_or("Invalid attribute value")?}
                else if dtype==3 {strings.get(data as usize).cloned().ok_or("Invalid typed string")?}
                else if dtype==0x10 || dtype==0x11 {data.to_string()}else if dtype==0x12 {(data!=0).to_string()}else{format!("@0x{data:08x}")};
                attrs.insert(key,value);
            }
            apply_element(&mut m,name,&attrs);
        }
        offset+=size;
    }
    if !manifest {return Err("No manifest element".into());}Ok(m)
}
fn parse_plist(bytes:&[u8])->Result<Metadata,String> {
    let value=plist::Value::from_reader(Cursor::new(bytes)).map_err(|_|"Invalid Info.plist")?;
    let d=value.as_dictionary().ok_or("Info.plist is not a dictionary")?;
    let read=|key:&str|d.get(key).and_then(|v|v.as_string()).map(str::to_owned);
    Ok(Metadata {package:read("CFBundleIdentifier"),version:read("CFBundleShortVersionString"),build:read("CFBundleVersion"),..Default::default()})
}

#[cfg(target_arch="wasm32")]
#[no_mangle]
pub extern "C" fn allocate(len:usize)->*mut u8 {
    let layout=std::alloc::Layout::array::<u8>(len.max(1)).unwrap();
    let p=unsafe {std::alloc::alloc(layout)};
    if p.is_null() {std::alloc::handle_alloc_error(layout);}p
}
#[cfg(target_arch="wasm32")]
#[no_mangle]
pub unsafe extern "C" fn release(ptr:*mut u8,len:usize) {std::alloc::dealloc(ptr,std::alloc::Layout::array::<u8>(len.max(1)).unwrap());}
#[cfg(target_arch="wasm32")]
#[no_mangle]
pub unsafe extern "C" fn compare(a:*const u8,al:usize,b:*const u8,bl:usize)->u64 {
    let result=compare_archives(std::slice::from_raw_parts(a,al),std::slice::from_raw_parts(b,bl));
    let json=match result {Ok(report)=>serde_json::json!({"report":report}),Err(error)=>serde_json::json!({"error":error})};
    let bytes=serde_json::to_vec(&json).unwrap();let len=bytes.len();let p=allocate(len);std::ptr::copy_nonoverlapping(bytes.as_ptr(),p,len);
    ((p as u64)<<32)|(len as u64)
}

#[cfg(test)]
mod tests {
    use super::*;use std::io::Write;
    fn zip(files:&[(&str,&[u8])])->Vec<u8> {
        let mut w=zip::ZipWriter::new(Cursor::new(Vec::new()));
        for (name,data) in files {w.start_file(*name,zip::write::SimpleFileOptions::default()).unwrap();w.write_all(data).unwrap();}
        w.finish().unwrap().into_inner()
    }
    #[test] fn exact_content_diff_and_order() {
        let a=zip(&[("same",b"ok"),("modified",b"old"),("removed",b"x")]);
        let b=zip(&[("same",b"ok"),("modified",b"new"),("added",b"longer")]);
        let r=compare_archives(&a,&b).unwrap();assert_eq!((r.added,r.removed,r.modified,r.unchanged),(1,1,1,1));assert_eq!(r.changes[0].path,"added");
    }
    #[test] fn same_content_ignores_zip_container_changes() {
        let a=zip(&[("a",b"hello"),("b",b"world")]);let b=zip(&[("b",b"world"),("a",b"hello")]);
        let r=compare_archives(&a,&b).unwrap();assert!(r.changes.is_empty());assert_eq!(r.unchanged,2);
    }
    #[test] fn detects_permissions_and_native_libraries() {
        let a=zip(&[("AndroidManifest.xml",br#"<manifest package="dev.test" xmlns:android="http://schemas.android.com/apk/res/android" android:versionName="1"><uses-permission android:name="android.permission.INTERNET"/></manifest>"#)]);
        let b=zip(&[("AndroidManifest.xml",br#"<manifest package="dev.test" xmlns:android="http://schemas.android.com/apk/res/android" android:versionName="2"><uses-permission android:name="android.permission.CAMERA"/><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35"/></manifest>"#),("lib/arm64-v8a/libnew.so",b"test")]);
        let r=compare_archives(&a,&b).unwrap();assert_eq!(r.permissions_added,vec!["android.permission.CAMERA"]);assert_eq!(r.permissions_removed,vec!["android.permission.INTERNET"]);assert_eq!(r.after.metadata.target_sdk.as_deref(),Some("35"));assert_eq!(r.libraries_added.len(),1);
    }
    #[test] fn rejects_malformed_and_mixed_inputs() {
        assert!(inspect(b"not a zip").is_err());
        let a=zip(&[("a",b"ok")]);let b=zip(&[("AndroidManifest.xml",b"<manifest/>")]);assert!(compare_archives(&a,&b).is_err());
        assert!(parse_axml(&[3,0,8,0,255,255,255,255]).is_err());
    }
    #[test] fn mac_root_normalized_and_binary_plist_supported() {
        let mut d=plist::Dictionary::new();d.insert("CFBundleIdentifier".into(),"dev.mac".into());d.insert("CFBundleVersion".into(),"7".into());
        let mut buf=Vec::new();plist::Value::Dictionary(d).to_writer_binary(&mut buf).unwrap();
        let a=zip(&[("Old.app/Contents/Info.plist",&buf),("Old.app/Contents/MacOS/app",b"binary")]);
        let b=zip(&[("New.app/Contents/Info.plist",&buf),("New.app/Contents/MacOS/app",b"binary")]);
        let r=compare_archives(&a,&b).unwrap();assert_eq!(r.after.kind,"Mac app ZIP");assert_eq!(r.after.metadata.build.as_deref(),Some("7"));assert_eq!(r.unchanged,2);
    }
    #[test] fn rejects_different_app_identifiers() {
        let a=zip(&[("AndroidManifest.xml",b"<manifest package=\"a\"/>")]);let b=zip(&[("AndroidManifest.xml",b"<manifest package=\"b\"/>")]);assert!(compare_archives(&a,&b).is_err());
    }
    #[test] fn oversized_expanded_archive_rejected() {
        let a=zip(&[("large",&vec![0u8;129*1024*1024])]);assert!(inspect(&a).unwrap_err().contains("safety limit"));
    }
    #[test] fn preserves_metadata_failure_as_warning() {
        let a=zip(&[("AndroidManifest.xml",b"broken")]);let r=compare_archives(&a,&a).unwrap();assert_eq!(r.before.warnings.len(),1);
    }
}
