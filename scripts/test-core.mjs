import { spawnSync } from 'node:child_process'
const suites = [
  'coach-workspace.test.mjs',
  'test-retail-model.mjs',
  'test-dual-role.mjs',
  'test-dual-role-billing.mjs',
  'test-marketplace.mjs',
  'test-marketplace-approval.mjs',
  'test-stripe-connect.mjs',
  'test-subscription-access.mjs',
  'test-workspace-presentation.mjs',
  'test-persistence.mjs',
  'test-email-results.mjs',
  'test-email-authorization.mjs',
]
for (const suite of suites) {
  const result = spawnSync(process.execPath, [`scripts/${suite}`], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}
console.log(`All ${suites.length} core suites passed.`)
