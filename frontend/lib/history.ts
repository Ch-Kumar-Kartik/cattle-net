import type { Prediction } from "@/lib/predictions"

export type PredictionHistoryItem = {
  id: number
  model_version: string
  predictions: Prediction[]
  created_at: string
}

type ErrorResponse = {
  detail?: string | unknown[]
}

export class HistoryApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HistoryApiError"
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

  return "The history service could not process this request."
}

export async function requestPredictionHistory(
  accessToken: string,
): Promise<PredictionHistoryItem[]> {
  let response: Response
  try {
    response = await fetch(`${getBackendBaseUrl()}/api/v1/predictions/history`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    throw new Error("Unable to reach the history service. Confirm that the backend is running.")
  }

  const payload = (await response.json().catch(() => null)) as
    | PredictionHistoryItem[]
    | ErrorResponse
    | null

  if (!response.ok) {
    throw new HistoryApiError(
      getErrorMessage(payload as ErrorResponse | null),
      response.status,
    )
  }

  if (!Array.isArray(payload)) {
    throw new Error("The history service returned an unexpected response.")
  }

  return payload
}
