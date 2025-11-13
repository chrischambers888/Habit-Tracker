const username = process.env.BASIC_AUTH_USER
const password =
  process.env.BASIC_AUTH_PASSWORD ?? process.env.BASIC_AUTH_PASS

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "habit-tracker-auth"

export const LOGIN_PATH = "/login"

const credentialHashPromise =
  username && password ? hashCredentials(username, password) : null

export function isAuthConfigured() {
  return Boolean(username && password)
}

export async function credentialsMatch(
  providedUser: string,
  providedPassword: string,
) {
  if (!isAuthConfigured()) {
    return false
  }

  return providedUser === username && providedPassword === password
}

export async function getExpectedSessionToken() {
  if (!credentialHashPromise) {
    return null
  }

  return credentialHashPromise
}

export async function verifySessionCookie(value: string | undefined | null) {
  if (!value) {
    return false
  }

  const expected = await getExpectedSessionToken()

  if (!expected) {
    return false
  }

  return value === expected
}

export async function hashCredentials(user: string, pass: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${user}:${pass}`)
  const digest = await crypto.subtle.digest("SHA-256", data)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}


