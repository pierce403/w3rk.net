import { execFileSync } from 'node:child_process'

/** @param {{ CF_COMMIT_SHA?: string }} [env] */
export function buildRevision(env = process.env, gitRevision = () =>
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()) {
  const revision = env.CF_COMMIT_SHA === undefined ? gitRevision() : env.CF_COMMIT_SHA
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Invalid build revision')
  return revision
}
