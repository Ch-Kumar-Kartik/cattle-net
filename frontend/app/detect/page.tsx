"use client"

import type { ChangeEvent, DragEvent } from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, Camera, Scan } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type Prediction,
  PredictionApiError,
  requestPredictions,
} from "@/lib/predictions"

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function validateFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Choose a JPEG, PNG, or WebP image."
  }

  if (file.size === 0) {
    return "Choose an image file that is not empty."
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "Choose an image smaller than 5 MB."
  }

  return null
}

function formatConfidence(confidence: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(confidence)
}

export default function DetectPage() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<Prediction[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) {
      return
    }

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setFile(null)
      setPreview(null)
      setPredictions(null)
      if (fileRef.current) {
        fileRef.current.value = ""
      }
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setPredictions(null)
    setError(null)
  }

  function onPick() {
    fileRef.current?.click()
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0])
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    selectFile(event.dataTransfer.files[0])
  }

  function clearPhoto() {
    setFile(null)
    setPreview(null)
    setPredictions(null)
    setError(null)
    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  async function onDetect() {
    if (!file || loading) {
      return
    }

    setLoading(true)
    setError(null)
    setPredictions(null)

    try {
      const response = await requestPredictions(file)
      const rankedPredictions = [...response.predictions]
        .sort((first, second) => second.confidence - first.confidence)
        .slice(0, 3)

      if (rankedPredictions.length !== 3) {
        throw new Error("The prediction service did not return three predictions.")
      }

      setPredictions(rankedPredictions)
    } catch (caughtError) {
      if (caughtError instanceof PredictionApiError) {
        setError(caughtError.message)
      } else if (caughtError instanceof Error) {
        setError(caughtError.message)
      } else {
        setError("Something went wrong while requesting predictions.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="w-full border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2 text-white shadow-lg">
              <Camera className="size-6" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                Cattle Detection
              </h1>
              <p className="text-sm text-gray-600">Upload and identify your cattle breed</p>
            </div>
          </div>
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </header>

      <div className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600" />
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Camera className="size-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Upload Cattle Photo</CardTitle>
                  <CardDescription className="text-gray-600">
                    Drag and drop your image or click to browse files
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <input
                ref={fileRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFile}
                type="file"
              />

              <div
                aria-label="Drop image here or click to upload"
                className="group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-300 p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50"
                onClick={onPick}
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onPick()
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {preview ? (
                  <div className="w-full max-w-md">
                    <div className="relative w-full overflow-hidden rounded-xl border-4 border-white shadow-2xl">
                      <img
                        alt="Selected cattle photo preview"
                        className="max-h-80 h-auto w-full object-cover"
                        src={preview}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-gray-700">
                      {file?.name} is ready to analyze.
                    </p>
                  </div>
                ) : (
                  <div className="transition-transform duration-300 group-hover:scale-105">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                      <Camera className="size-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">Upload Your Photo</h3>
                    <p className="max-w-sm text-gray-600">
                      Supports JPEG, PNG, and WebP images up to 5 MB. For best results,
                      use good lighting and a clear view of the cattle.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button
                  className="transform rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                  disabled={!file || loading}
                  onClick={onDetect}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 size-5" />
                      Analyze Now
                    </>
                  )}
                </Button>
                <Button
                  className="rounded-full px-6"
                  disabled={loading || !file}
                  onClick={clearPhoto}
                  variant="outline"
                >
                  Clear Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <Scan className="size-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Breed Predictions</CardTitle>
                  <CardDescription className="text-gray-600">
                    Top three confidence-ranked predictions from the classifier
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {predictions ? (
                <ol className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <li
                      className="flex items-center justify-between rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 p-5"
                      key={`${prediction.breed}-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-900">{prediction.breed}</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-700">
                        {formatConfidence(prediction.confidence)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                  Upload and analyze a photo to see the top three breed predictions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
