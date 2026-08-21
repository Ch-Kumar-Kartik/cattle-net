export type Prediction = {
  breed: string
  confidence: number
}

export type PredictionResponse = {
  model_version: string
  predictions: Prediction[]
}

type ErrorResponse = {
  detail?: string | unknown[]
}

export class PredictionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "PredictionApiError"
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

  return "The backend could not process this image."
}

export async function requestPredictions(file: File): Promise<PredictionResponse> {
  const formData = new FormData()
  formData.append("file", file)
  const backendBaseUrl = getBackendBaseUrl()

  let response: Response
  try {
    response = await fetch(`${backendBaseUrl}/api/v1/predictions`, {
      method: "POST",
      body: formData,
    })
  } catch {
    throw new Error(
      "Unable to reach the prediction service. Confirm that the backend is running.",
    )
  }

  const payload = (await response.json().catch(() => null)) as
    | PredictionResponse
    | ErrorResponse
    | null

  if (!response.ok) {
    throw new PredictionApiError(
      getErrorMessage(payload as ErrorResponse | null),
      response.status,
    )
  }

  if (!payload || !Array.isArray((payload as PredictionResponse).predictions)) {
    throw new Error("The prediction service returned an unexpected response.")
  }

  return payload as PredictionResponse
}
