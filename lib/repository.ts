export interface UserRow {
  id: string; address: string; displayName: string; ensName: string | null; baseName: string | null;
  farcasterHandle: string | null; joinedAt: string; bio: string | null
}
interface ListingRow { id: string; title: string; budget?: string; rate?: string; description: string; createdAt: string; updatedAt: string; userId: string; address: string; displayName: string }
interface SkillRow { id: string; name: string; userId: string; address: string; displayName: string }
interface EndorsementRow { id: string; createdAt: string; skillId: string; endorserId: string; address: string; displayName: string }
interface RoomRow { id: string; type: string; title: string | null; jobId: string | null; serviceId: string | null; createdAt: string; updatedAt: string }
interface MessageRow { id: string; content: string; xmtpId: string | null; createdAt: string; chatRoomId: string; senderId: string; address: string; displayName: string; ensName: string | null; baseName: string | null }
export class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }
export const publicUser = (u: Pick<UserRow, 'address' | 'displayName'> & Partial<UserRow>) => ({address: u.address, displayName: u.displayName, ensName: u.ensName ?? null, baseName: u.baseName ?? null})
const stamp = () => new Date().toISOString()
export class Repository {
  constructor(readonly db: D1Database) {}
  stmt(sql: string, ...params: (string | number | null)[]) { return this.db.prepare(sql).bind(...params) }
  async rows<T>(sql: string, ...params: (string | number | null)[]) { return (await this.stmt(sql, ...params).all<T>()).results }
  user(address: string) { return this.stmt('SELECT * FROM users WHERE address = ? COLLATE NOCASE', address).first<UserRow>() }
  userInsert(address: string, now = stamp()) {
    return this.stmt('INSERT INTO users (id,address,displayName,joinedAt) VALUES (?,?,?,?) ON CONFLICT(address) DO NOTHING', crypto.randomUUID(), address, `${address.slice(0,6)}...${address.slice(-4)}`, now)
  }
  async findUser(identifier: string) {
    return this.stmt('SELECT * FROM users WHERE address = ? COLLATE NOCASE OR ensName = ? OR baseName = ? OR displayName = ? LIMIT 1', identifier, identifier, identifier, identifier).first<UserRow>()
  }
  async listings(table: 'jobs' | 'services', id?: string) {
    const rows = await this.rows<ListingRow>(`SELECT t.*, t."desc" AS description,u.address,u.displayName FROM ${table} t JOIN users u ON u.id=t.userId ${id ? 'WHERE t.id=?' : ''} ORDER BY t.createdAt DESC`, ...id ? [id] : [])
    return rows.map(({ address, displayName, userId, ...row }) => ({ ...row, user: { address, displayName } }))
  }
  async createListing(table: 'jobs' | 'services', address: string, title: string, amount: string, desc: string) {
    const id = crypto.randomUUID(), now = stamp(), column = table === 'jobs' ? 'budget' : 'rate'
    await this.db.batch([this.userInsert(address, now), this.stmt(`INSERT INTO ${table} (id,title,${column},"desc",createdAt,updatedAt,userId) SELECT ?,?,?,?,?,?,id FROM users WHERE address=? COLLATE NOCASE`, id,title,amount,desc,now,now,address)])
    return (await this.listings(table,id))[0]
  }
  async skills(address?: string) {
    const rows = await this.rows<SkillRow>(`SELECT s.*,u.address,u.displayName FROM skills s JOIN users u ON u.id=s.userId ${address ? 'WHERE u.address=? COLLATE NOCASE' : ''} ORDER BY s.createdAt DESC`, ...address ? [address] : [])
    return Promise.all(rows.map(async s => {
      const endorsements = await this.rows<EndorsementRow>('SELECT e.*,u.address,u.displayName FROM endorsements e JOIN users u ON u.id=e.endorserId WHERE e.skillId=? ORDER BY e.createdAt',s.id)
      return { id:s.id,name:s.name,user:s.address,userDisplayName:s.displayName,endorsements:endorsements.map(e=>e.address),endorsementDetails:endorsements.map(e=>({address:e.address,displayName:e.displayName,endorsedAt:e.createdAt})) }
    }))
  }
  async createSkill(address: string, name: string) {
    const now=stamp()
    const results=await this.db.batch([this.userInsert(address,now),this.stmt('INSERT INTO skills (id,name,createdAt,userId) SELECT ?,?,?,id FROM users WHERE address=? COLLATE NOCASE ON CONFLICT(userId,name) DO NOTHING',crypto.randomUUID(),name,now,address)])
    return { created: results[1].meta.changes > 0, skill: (await this.skills(address)).find(s=>s.name===name)! }
  }
  async endorse(address: string, owner: string, name: string) {
    const skill=await this.stmt('SELECT s.id FROM skills s JOIN users u ON u.id=s.userId WHERE u.address=? COLLATE NOCASE AND s.name=?',owner,name).first<{id:string}>()
    if (!skill) throw new HttpError(404,'Skill not found')
    const id=crypto.randomUUID(),now=stamp()
    const results=await this.db.batch([this.userInsert(address,now),this.stmt('INSERT INTO endorsements (id,createdAt,skillId,endorserId) SELECT ?,?,?,id FROM users WHERE address=? COLLATE NOCASE ON CONFLICT(skillId,endorserId) DO NOTHING',id,now,skill.id,address)])
    if (!results[1].meta.changes) throw new HttpError(400,'Already endorsed')
    const user=await this.user(address)
    return {success:true,endorsement:{id,endorser:address,endorserDisplayName:user!.displayName,skill:name,skillOwner:owner,createdAt:now}}
  }
  async participant(roomId: string,address: string) {
    return this.stmt('SELECT u.* FROM users u JOIN chat_participants p ON p.userId=u.id WHERE p.chatRoomId=? AND u.address=? COLLATE NOCASE',roomId,address).first<UserRow>()
  }
  async room(id: string) {
    const row=await this.stmt('SELECT * FROM chat_rooms WHERE id=?',id).first<RoomRow>()
    if (!row) throw new HttpError(404,'Room not found')
    const participants=await this.rows<UserRow & {participantId:string;joinedAt:string}>('SELECT u.*,p.id AS participantId,p.joinedAt FROM chat_participants p JOIN users u ON u.id=p.userId WHERE p.chatRoomId=?',id)
    const messages=await this.messages(id, undefined, true)
    return {...row,participants:participants.map(p=>({id:p.participantId,userId:p.id,chatRoomId:id,joinedAt:p.joinedAt,user:publicUser(p)})),messages,job:row.jobId?(await this.listings('jobs',row.jobId))[0]:null,service:row.serviceId?(await this.listings('services',row.serviceId))[0]:null}
  }
  async rooms(address: string) {
    const rows=await this.rows<{id:string}>('SELECT r.id FROM chat_rooms r JOIN chat_participants p ON p.chatRoomId=r.id JOIN users u ON u.id=p.userId WHERE u.address=? COLLATE NOCASE ORDER BY r.updatedAt DESC',address)
    return Promise.all(rows.map(r=>this.room(r.id)))
  }
  async createRoom(address: string, data: {type:string;title:string|null;jobId:string|null;serviceId:string|null;participantAddresses:string[]}) {
    const id=crypto.randomUUID(),now=stamp()
    const addresses=[...new Map([address,...data.participantAddresses].map(a=>[a.toLowerCase(),a])).values()]
    const statements=addresses.map(a=>this.userInsert(a,now))
    statements.push(this.stmt('INSERT INTO chat_rooms (id,type,title,createdAt,updatedAt,jobId,serviceId) VALUES (?,?,?,?,?,?,?)',id,data.type,data.title,now,now,data.jobId,data.serviceId))
    for (const a of addresses) statements.push(this.stmt('INSERT INTO chat_participants (id,joinedAt,chatRoomId,userId) SELECT ?,?,?,id FROM users WHERE address=? COLLATE NOCASE',crypto.randomUUID(),now,id,a))
    await this.db.batch(statements)
    return this.room(id)
  }
  async messages(roomId:string,address?:string,latest=false) {
    if (address && !await this.participant(roomId,address)) throw new HttpError(403,'Forbidden')
    const rows=await this.rows<MessageRow>(`SELECT m.*,u.address,u.displayName,u.ensName,u.baseName FROM chat_messages m JOIN users u ON u.id=m.senderId WHERE m.chatRoomId=? ORDER BY m.createdAt ${latest?'DESC LIMIT 1':'ASC'}`,roomId)
    return rows.map(({address,displayName,ensName,baseName,...r})=>({...r,sender:{address,displayName,ensName,baseName}}))
  }
  async createMessage(roomId:string,address:string,content:string,xmtpId:string|null) {
    const user=await this.participant(roomId,address)
    if (!user) throw new HttpError(403,'Forbidden')
    const id=crypto.randomUUID(),now=stamp()
    const results=await this.db.batch([
      this.stmt('INSERT INTO chat_messages (id,content,xmtpId,createdAt,chatRoomId,senderId) SELECT ?,?,?,?,?,userId FROM chat_participants WHERE chatRoomId=? AND userId=?',id,content,xmtpId,now,roomId,roomId,user.id),
      this.stmt('UPDATE chat_rooms SET updatedAt=? WHERE id=? AND EXISTS (SELECT 1 FROM chat_messages WHERE id=?)',now,roomId,id),
    ])
    if (!results[0].meta.changes) throw new HttpError(403,'Forbidden')
    return {id,content,xmtpId,createdAt:now,chatRoomId:roomId,senderId:user.id,sender:publicUser(user)}
  }
}
