export type Cattle = {
  id: number
  name: string
  breed: string
  date_of_birth: string | null
  created_at: string
}

export type DietPlan = {
  id: number
  cattle_id: number
  fodder_kg_per_day: number
  concentrate_kg_per_day: number
  supplements: string | null
  notes: string | null
  created_at: string
}

export type VaccinationRecord = {
  id: number
  cattle_id: number
  vaccine_name: string
  administered_on: string
  next_due_on: string
  notes: string | null
  created_at: string
}

type ErrorResponse = {
  detail?: string | unknown[]
}

export class CareApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "CareApiError"
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

  return "The cattle-care service could not process this request."
}

async function requestCare<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getBackendBaseUrl()}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    })
  } catch {
    throw new Error("Unable to reach the cattle-care service. Confirm that the backend is running.")
  }

  const payload = (await response.json().catch(() => null)) as T | ErrorResponse | null

  if (!response.ok) {
    throw new CareApiError(
      getErrorMessage(payload as ErrorResponse | null),
      response.status,
    )
  }

  if (!payload) {
    throw new Error("The cattle-care service returned an unexpected response.")
  }

  return payload as T
}

export function requestCattle(accessToken: string): Promise<Cattle[]> {
  return requestCare("/api/v1/care/cattle", accessToken)
}

export function createCattle(
  accessToken: string,
  payload: Pick<Cattle, "name" | "breed" | "date_of_birth">,
): Promise<Cattle> {
  return requestCare("/api/v1/care/cattle", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function requestDietPlans(accessToken: string, cattleId: number): Promise<DietPlan[]> {
  return requestCare(`/api/v1/care/cattle/${cattleId}/diet-plans`, accessToken)
}

export function createDietPlan(
  accessToken: string,
  payload: Omit<DietPlan, "id" | "created_at">,
): Promise<DietPlan> {
  return requestCare("/api/v1/care/diet-plans", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function createVaccination(
  accessToken: string,
  payload: Omit<VaccinationRecord, "id" | "created_at">,
): Promise<VaccinationRecord> {
  return requestCare("/api/v1/care/vaccinations", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function requestUpcomingVaccinations(
  accessToken: string,
  days = 30,
): Promise<VaccinationRecord[]> {
  return requestCare(`/api/v1/care/vaccinations/upcoming?days=${days}`, accessToken)
}
