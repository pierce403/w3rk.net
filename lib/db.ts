import { env } from 'cloudflare:workers'
import { Repository } from './repository'
export const getRepository = () => new Repository(env.DB)
export const isReadOnly = () => String(env.READ_ONLY) !== 'false'
