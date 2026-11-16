export interface Metadata { package: string | null; version: string | null; build: string | null; min_sdk: string | null; target_sdk: string | null; permissions: string[]; }
export interface Entry { path: string; size: number; compressed: number; sha256: string; }
export interface Archive { kind: string; bytes: number; expanded: number; files: number; metadata: Metadata; libraries: string[]; warnings: string[]; }
export interface Change { path: string; status: 'added'|'removed'|'modified'; before: number; after: number; delta: number; }
export interface Report { before: Archive; after: Archive; added: number; removed: number; modified: number; unchanged: number; delta: number; permissions_added: string[]; permissions_removed: string[]; libraries_added: string[]; libraries_removed: string[]; changes: Change[]; }
export interface Message { role: 'user'|'assistant'; text: string; view?: 'summary'|'permissions'|'files'|'size'; }
export interface Session { id: string; title: string; date: string; messages: Message[]; report: Report | null; names: string[]; demo: boolean; }
