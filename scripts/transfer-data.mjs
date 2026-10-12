import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
export const fields={
 users:['id','address','ensName','baseName','displayName','farcasterHandle','joinedAt','bio'],
 jobs:['id','title','budget','desc','createdAt','updatedAt','userId'],
 services:['id','title','rate','desc','createdAt','updatedAt','userId'],
 skills:['id','name','createdAt','userId'],
 endorsements:['id','createdAt','skillId','endorserId'],
 chat_rooms:['id','type','title','createdAt','updatedAt','jobId','serviceId'],
 chat_participants:['id','joinedAt','chatRoomId','userId'],
 chat_messages:['id','content','xmtpId','createdAt','chatRoomId','senderId'],
}
const nullable={users:['ensName','baseName','farcasterHandle','bio'],chat_rooms:['title','jobId','serviceId'],chat_messages:['xmtpId']}
const references={jobs:{userId:'users'},services:{userId:'users'},skills:{userId:'users'},endorsements:{skillId:'skills',endorserId:'users'},chat_rooms:{jobId:'jobs',serviceId:'services'},chat_participants:{chatRoomId:'chat_rooms',userId:'users'},chat_messages:{chatRoomId:'chat_rooms',senderId:'users'}}
function exact(actual,expected,label){if(actual.sort().join('\0')!==[...expected].sort().join('\0'))throw Error(`Unexpected fields in ${label}`)}
export function validate(snapshot){
 if(!snapshot||typeof snapshot!=='object')throw Error('Invalid snapshot')
 exact(Object.keys(snapshot),['schemaVersion','exportedAt','tables'],'snapshot')
 if(snapshot.schemaVersion!==1||!Number.isFinite(Date.parse(snapshot.exportedAt)))throw Error('Invalid snapshot version/time')
 exact(Object.keys(snapshot.tables),Object.keys(fields),'tables')
 const ids={}
 for(const [table,cols] of Object.entries(fields)){
  const rows=snapshot.tables[table];if(!Array.isArray(rows))throw Error(`Invalid table ${table}`)
  ids[table]=new Set()
  for(const row of rows){
   if(!row||typeof row!=='object'||Array.isArray(row))throw Error(`Invalid row in ${table}`)
   exact(Object.keys(row),cols,table)
   for(const col of cols){
    const v=row[col]
    if(v===null&&(nullable[table]??[]).includes(col))continue
    if(typeof v!=='string'||v.includes('\0'))throw Error(`Invalid ${table}.${col}`)
    if((col==='id'||col.endsWith('Id'))&&(!v.length||v.length>512))throw Error(`Invalid identifier ${table}.${col}`)
    if(col.endsWith('At')&&(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)||new Date(v).toISOString()!==v))throw Error(`Invalid timestamp ${table}.${col}`)
   }
   if(!row.id||ids[table].has(row.id))throw Error(`Duplicate or empty id in ${table}`)
   ids[table].add(row.id)
  }
 }
 for(const [table,refs]of Object.entries(references))for(const row of snapshot.tables[table])for(const [col,target]of Object.entries(refs))if(row[col]!==null&&!ids[target].has(row[col]))throw Error(`Dangling reference ${table}.${col}`)
 const unique=(rows,key,label)=>{const seen=new Set();for(const r of rows){const v=key(r);if(seen.has(v))throw Error(`Duplicate ${label}`);seen.add(v)}}
 for(const row of snapshot.tables.users)if(!/^0x[0-9a-fA-F]{40}$/.test(row.address))throw Error('Invalid user address')
 unique(snapshot.tables.users,r=>r.address.toLowerCase(),'case-insensitive wallet address')
 unique(snapshot.tables.skills,r=>JSON.stringify([r.userId,r.name]),'user skill')
 unique(snapshot.tables.endorsements,r=>JSON.stringify([r.skillId,r.endorserId]),'endorsement')
 unique(snapshot.tables.chat_participants,r=>JSON.stringify([r.chatRoomId,r.userId]),'chat participant')
 return snapshot
}
export function canonical(snapshot){validate(snapshot);return JSON.stringify(Object.fromEntries(Object.entries(fields).map(([table,cols])=>[table,[...snapshot.tables[table]].sort((a,b)=>a.id.localeCompare(b.id,'en')).map(row=>Object.fromEntries(cols.map(c=>[c,row[c]])))])))}
export function report(snapshot){return{sha256:createHash('sha256').update(canonical(snapshot)).digest('hex'),counts:Object.fromEntries(Object.keys(fields).map(t=>[t,snapshot.tables[t].length]))}}
export function sql(snapshot,target){
 validate(snapshot)
 if(!['d1','pg'].includes(target))throw Error('Unknown SQL target')
 const quote=v=>v===null?'NULL':"'"+v.replaceAll("'","''")+"'"
 const lines=target==='pg'?['BEGIN;','SET LOCAL standard_conforming_strings = on;',`LOCK TABLE ${Object.keys(fields).map(t=>'"'+t+'"').join(',')} IN ACCESS EXCLUSIVE MODE;`,`DO $$ BEGIN IF ${Object.keys(fields).map(t=>`EXISTS (SELECT 1 FROM "${t}")`).join(' OR ')} THEN RAISE EXCEPTION 'Recovery destination must be empty'; END IF; END $$;`]:[]
 for(const [table,cols]of Object.entries(fields))for(const row of snapshot.tables[table])lines.push(`INSERT INTO "${table}" (${cols.map(c=>'"'+c+'"').join(',')}) VALUES (${cols.map(c=>quote(row[c])).join(',')});`)
 if(target==='pg')lines.push('COMMIT;')
 return lines.join('\n')+'\n'
}
// Prisma PostgreSQL TIMESTAMP(3) stores UTC without a zone. Format in SQL so the
// Node process timezone cannot shift values when pg parses timestamps as Date.
export function pgColumns(table){return fields[table].map(c=>c.endsWith('At')?`to_char("${c}", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "${c}"`:'"'+c+'"').join(',')}
async function privateWrite(path,text){await writeFile(path,text,{mode:0o600,flag:'wx'})}
export async function main(args){
 const [command,input,output]=args
 if(command==='export-pg'){
  if(!input||!process.env.DATABASE_URL)throw Error('export-pg OUTPUT requires DATABASE_URL in the process environment')
  const {Client}=await import('pg');const client=new Client({connectionString:process.env.DATABASE_URL})
  await client.connect()
  try{
   await client.query("SET TIME ZONE 'UTC'")
   await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
   const tables={}
   for(const [table,cols]of Object.entries(fields)){const {rows}=await client.query(`SELECT ${pgColumns(table)} FROM "${table}" ORDER BY id`);tables[table]=rows.map(row=>Object.fromEntries(cols.map(c=>[c,row[c] instanceof Date?row[c].toISOString():row[c]])))}
   await client.query('COMMIT')
   const snapshot=validate({schemaVersion:1,exportedAt:new Date().toISOString(),tables})
   await privateWrite(input,JSON.stringify(snapshot)+'\n');console.log(JSON.stringify(report(snapshot)))
  }finally{await client.end()}
 }else if(command==='from-d1-json'){
  if(!input||!output)throw Error('from-d1-json INPUT OUTPUT required')
  // INPUT is an object keyed by table, each containing SELECT results, not a raw account export.
  const tables=JSON.parse(await readFile(input,'utf8'));const snapshot=validate({schemaVersion:1,exportedAt:new Date().toISOString(),tables})
  await privateWrite(output,JSON.stringify(snapshot)+'\n');console.log(JSON.stringify(report(snapshot)))
 }else{
  if(!input)throw Error('Expected validate INPUT, sql-d1 INPUT OUTPUT, or sql-pg INPUT OUTPUT')
  const snapshot=validate(JSON.parse(await readFile(input,'utf8')))
  if(command==='validate')console.log(JSON.stringify(report(snapshot)))
  else if(['sql-d1','sql-pg'].includes(command)&&output){await privateWrite(output,sql(snapshot,command.slice(4)));console.log(JSON.stringify(report(snapshot)))}
  else throw Error('Unknown command')
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(()=>{console.error('Transfer failed; validate input, destination, and connectivity. No private data is printed.');process.exitCode=1})
