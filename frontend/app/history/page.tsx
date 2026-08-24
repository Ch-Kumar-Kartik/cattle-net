"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Camera, History, Loader2, Scan } from "lucide-react"

import { clearAccessToken, getAccessToken } from "@/lib/auth"
import {
  type PredictionHistoryItem,
  HistoryApiError,
  requestPredictionHistory,
} from "@/lib/history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function formatConfidence(confidence: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(confidence)
}

function formatDate(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}

export default function HistoryPage() {
  const [history, setHistory] = useState<PredictionHistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)

    const accessToken = getAccessToken()
    if (!accessToken) {
      setHistory(null)
      setError("Sign in to view your prediction history.")
      setLoading(false)
      return
    }

    try {
      setHistory(await requestPredictionHistory(accessToken))
    } catch (caughtError) {
      if (caughtError instanceof HistoryApiError && caughtError.status === 401) {
        clearAccessToken()
        setError("Your session has expired. Sign in again to view history.")
      } else if (caughtError instanceof Error) {
        setError(caughtError.message)
      } else {
        setError("Something went wrong while loading your history.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="w-full border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link className="flex items-center gap-3" href="/">
            <span className="rounded-xl bg-blue-600 p-2 text-white shadow-lg">
              <Camera className="size-6" />
            </span>
            <div>
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                Cattle Detection
              </h1>
              <p className="text-sm text-gray-600">Your saved breed predictions</p>
            </div>
          </Link>
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/detect">Analyze an image</Link>
          </Button>
        </div>
      </header>

      <div className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-emerald-100 p-2">
                  <History className="size-6 text-emerald-600" />
                </span>
                <div>
                  <CardTitle className="text-xl text-gray-900">Prediction History</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your previous cattle breed classifications, newest first.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-gray-600">
                  <Loader2 className="size-5 animate-spin" />
                  Loading history...
                </div>
              )}

              {!loading && error && (
                <div className="space-y-4">
                  <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                  <Button asChild className="rounded-full">
                    <Link href="/auth">Sign in</Link>
                  </Button>
                </div>
              )}

              {!loading && !error && history?.length === 0 && (
                <div className="py-12 text-center">
                  <Scan className="mx-auto mb-4 size-10 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">No predictions yet</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Analyze your first cattle image to start building history.
                  </p>
                  <Button asChild className="mt-5 rounded-full">
                    <Link href="/detect">Analyze an image</Link>
                  </Button>
                </div>
              )}

              {!loading && !error && history && history.length > 0 && (
                <div className="space-y-4">
                  {history.map((record) => (
                    <article className="rounded-xl border border-gray-200 bg-white p-5" key={record.id}>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-semibold text-gray-900">Model {record.model_version}</h2>
                          <p className="text-sm text-gray-600">{formatDate(record.created_at)}</p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {record.predictions.length} predictions
                        </span>
                      </div>
                      <ol className="space-y-2">
                        {record.predictions.map((prediction, index) => (
                          <li className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3" key={`${record.id}-${prediction.breed}-${index}`}>
                            <span className="font-medium text-gray-900">
                              {index + 1}. {prediction.breed}
                            </span>
                            <span className="font-semibold text-emerald-700">
                              {formatConfidence(prediction.confidence)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
