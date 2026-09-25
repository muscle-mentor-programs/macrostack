import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
for (const endpoint of ['notify', 'report', 'meal-plan', 'send']) {
  const code = readFileSync(`api/email/${endpoint}.js`, 'utf8').replace(/^import .*$/gm, '').replace('export default async function handler', 'async function handler')
  for (const rejected of [true, false]) {
    class Resend { emails = { send: async () => rejected ? { error: { message: 'Provider rejection' }, data: null } : { error: null, data: { id: 'message' } } } }
    const context = vm.createContext({ Resend, handleNativeCors: () => false, requireEmailRecipients: async () => true, requireUser: async () => ({ user: { id: 'fixture' } }), process: { env: { RESEND_API_KEY: 'fixture' } }, newMessageTemplate: () => '', welcomeTemplate: () => '', reminderTemplate: () => '', mealPlanTemplate: () => '', weeklyReportTemplate: () => '', coachBroadcastTemplate: () => '' })
    vm.runInContext(`${code};this.handler=handler`, context)
    const response = { status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
    await context.handler({ method: 'POST', body: { to: endpoint === 'send' ? ['test@example.invalid'] : 'test@example.invalid', recipientEmail: 'test@example.invalid', type: 'welcome', clientName: 'Test', planName: 'Plan', pdfBase64: 'fixture', subject: 'Subject', body: 'Content' } }, response)
    assert.equal(response.code, rejected ? 502 : 200, endpoint)
    assert.equal(Boolean(response.body.ok), !rejected, endpoint)
    if (endpoint === 'send') assert.equal(response.body.failed, rejected ? 1 : 0)
  }
  console.log(`PASS ${endpoint}: provider rejection never reports email success`)
}
