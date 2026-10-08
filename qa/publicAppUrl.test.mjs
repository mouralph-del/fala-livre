import assert from 'node:assert/strict'
import { getPublicPaymentDemoUrl } from '../src/utils/publicAppUrl.js'

const local = 'http://localhost:5173'
assert.equal(getPublicPaymentDemoUrl('https://example.com/falalivre/?unused=true#old', local), 'https://example.com/falalivre/#/pagamento-demo')
assert.equal(getPublicPaymentDemoUrl('https://example.com/falalivre', local), 'https://example.com/falalivre/#/pagamento-demo')
assert.equal(getPublicPaymentDemoUrl('', 'https://example.com'), 'https://example.com/#/pagamento-demo')
assert.equal(getPublicPaymentDemoUrl(undefined, local), null)
for (const url of ['http://example.com', 'https://localhost', 'https://app.localhost', 'https://app.local', 'https://app.internal', 'https://app.lan', 'https://app.home', 'https://app.test', 'https://app.invalid', 'https://intranet', 'https://127.0.0.1', 'https://127.1', 'https://0x7f000001', 'https://192.168.0.10', 'https://10.0.0.1', 'https://172.16.0.1', 'https://169.254.1.1', 'https://8.8.8.8', 'https://[::1]', 'https://[fd00::1]', 'https://[::ffff:127.0.0.1]', 'https://user:password@example.com', 'not a URL', '/relative']) {
  assert.equal(getPublicPaymentDemoUrl(url, 'https://example.com'), null, url)
}
console.log('PASS public QR URL: configured HTTPS, deployment subdirectory, public origin fallback, missing/local/invalid/private/IP/credentials rejected; no authorization parameters')
