// Integration point for the future account service. No network or persistence.
export class AccountServiceUnavailable extends Error {
  constructor() { super('account-service-unavailable'); this.name = 'AccountServiceUnavailable' }
}

export async function requestAccountAccess() {
  throw new AccountServiceUnavailable()
}
