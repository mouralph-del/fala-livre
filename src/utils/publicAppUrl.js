// Syntactic validation only: deployment/DNS availability must be checked by its owner.
export function getPublicPaymentDemoUrl(configuredUrl, currentOrigin) {
  const candidate = configuredUrl?.trim() || currentOrigin
  try {
    const url = new URL(candidate)
    const host = url.hostname.toLowerCase().replace(/\.$/, '')
    if (url.protocol !== 'https:' || url.username || url.password) return null
    // Reject IP literals (including normalized shorthand IPv4), local hostnames
    // and reserved/internal suffixes rather than assuming another device can reach them.
    if (!host.includes('.') || host.includes(':') || /^[\d.]+$/.test(host)) return null
    if (/(^|\.)(localhost|local|internal|lan|home|test|invalid)$/.test(host)) return null
    if (!host.split('.').every(label => /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/.test(label))) return null
    url.search = ''
    url.hash = '/pagamento-demo'
    if (!url.pathname.endsWith('/')) url.pathname += '/'
    return url.href
  } catch {
    return null
  }
}
