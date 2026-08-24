export type RegisteredUser = {
  id: number
  email: string
  created_at: string
}

export type TokenResponse = {
  access_token: string
  token_type: "bearer"
}

type ErrorResponse = {
  detail?: string | unknown[]
}

const ACCESS_TOKEN_KEY = "cattle-net.access-token"

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "AuthApiError"
  }
}

function getBackendBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
  }

  return baseUrl
}

function getErrorMessage(payload: ErrorResponse | null): string {
  if (typeof payload?.detail === "string") {
    return payload.detail
  }

  return "The authentication service could not process this request."
}

async function requestAuth<T>(
  path: "/api/v1/auth/register" | "/api/v1/auth/login",
  email: string,
  password: string,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getBackendBaseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new Error(
      "Unable to reach the authentication service. Confirm that the backend is running.",
    )
  }

  const payload = (await response.json().catch(() => null)) as T | ErrorResponse | null

  if (!response.ok) {
    throw new AuthApiError(
      getErrorMessage(payload as ErrorResponse | null),
      response.status,
    )
  }

  if (!payload) {
    throw new Error("The authentication service returned an unexpected response.")
  }

  return payload as T
}

export function registerUser(email: string, password: string): Promise<RegisteredUser> {
  return requestAuth("/api/v1/auth/register", email, password)
}

export function loginUser(email: string, password: string): Promise<TokenResponse> {
  return requestAuth("/api/v1/auth/login", email, password)
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(accessToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}
