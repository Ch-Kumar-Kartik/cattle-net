"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, Beef, CalendarDays, Loader2, Save } from "lucide-react"

import { clearAccessToken, getAccessToken } from "@/lib/auth"
import {
  CareApiError,
  type Cattle,
  type DietPlan,
  type VaccinationRecord,
  createCattle,
  createDietPlan,
  createVaccination,
  requestCattle,
  requestDietPlans,
  requestUpcomingVaccinations,
} from "@/lib/care"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

function numericInput(value: string): number {
  return Number(value)
}

export function CareManager() {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [selectedCattleId, setSelectedCattleId] = useState<number | null>(null)
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<VaccinationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cattleName, setCattleName] = useState("")
  const [breed, setBreed] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [fodder, setFodder] = useState("")
  const [concentrate, setConcentrate] = useState("")
  const [supplements, setSupplements] = useState("")
  const [dietNotes, setDietNotes] = useState("")
  const [vaccineName, setVaccineName] = useState("")
  const [administeredOn, setAdministeredOn] = useState("")
  const [nextDueOn, setNextDueOn] = useState("")
  const [vaccinationNotes, setVaccinationNotes] = useState("")

  function handleRequestError(caughtError: unknown): void {
    if (caughtError instanceof CareApiError && caughtError.status === 401) {
      clearAccessToken()
      setError("Your session has expired. Sign in again to manage cattle-care records.")
      return
    }

    setError(
      caughtError instanceof Error
        ? caughtError.message
        : "The cattle-care service could not process this request.",
    )
  }

  async function loadCareData(cattleId?: number | null): Promise<void> {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setError("Sign in to save and view cattle-care records.")
      setIsLoading(false)
      return
    }

    try {
      const [cattleRecords, vaccinations] = await Promise.all([
        requestCattle(accessToken),
        requestUpcomingVaccinations(accessToken),
      ])
      const activeCattleId = cattleId ?? selectedCattleId ?? cattleRecords[0]?.id ?? null

      setCattle(cattleRecords)
      setUpcomingVaccinations(vaccinations)
      setSelectedCattleId(activeCattleId)

      if (activeCattleId) {
        setDietPlans(await requestDietPlans(accessToken, activeCattleId))
      } else {
        setDietPlans([])
      }
    } catch (caughtError) {
      handleRequestError(caughtError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCareData()
  }, [])

  async function handleCattleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const accessToken = getAccessToken()
    if (!accessToken) {
      setError("Sign in to save cattle records.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const newCattle = await createCattle(accessToken, {
        name: cattleName.trim(),
        breed: breed.trim(),
        date_of_birth: dateOfBirth || null,
      })
      setCattleName("")
      setBreed("")
      setDateOfBirth("")
      await loadCareData(newCattle.id)
    } catch (caughtError) {
      handleRequestError(caughtError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDietPlanSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const accessToken = getAccessToken()
    if (!accessToken || !selectedCattleId) {
      setError("Add and select cattle before saving a diet plan.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await createDietPlan(accessToken, {
        cattle_id: selectedCattleId,
        fodder_kg_per_day: numericInput(fodder),
        concentrate_kg_per_day: numericInput(concentrate),
        supplements: supplements.trim() || null,
        notes: dietNotes.trim() || null,
      })
      setFodder("")
      setConcentrate("")
      setSupplements("")
      setDietNotes("")
      await loadCareData(selectedCattleId)
    } catch (caughtError) {
      handleRequestError(caughtError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVaccinationSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const accessToken = getAccessToken()
    if (!accessToken || !selectedCattleId) {
      setError("Add and select cattle before saving a vaccination record.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await createVaccination(accessToken, {
        cattle_id: selectedCattleId,
        vaccine_name: vaccineName.trim(),
        administered_on: administeredOn,
        next_due_on: nextDueOn,
        notes: vaccinationNotes.trim() || null,
      })
      setVaccineName("")
      setAdministeredOn("")
      setNextDueOn("")
      setVaccinationNotes("")
      await loadCareData(selectedCattleId)
    } catch (caughtError) {
      handleRequestError(caughtError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCattleSelection(cattleId: number): Promise<void> {
    setSelectedCattleId(cattleId)
    setIsLoading(true)
    await loadCareData(cattleId)
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p>{error}</p>
            {!getAccessToken() && (
              <Link href="/auth" className="mt-2 inline-block font-medium underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <Beef className="size-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Your cattle</CardTitle>
              <CardDescription>Add cattle before recording their care plan.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCattleSubmit} className="grid gap-4 md:grid-cols-4">
            <Input value={cattleName} onChange={(event) => setCattleName(event.target.value)} placeholder="Cattle name" required />
            <Input value={breed} onChange={(event) => setBreed(event.target.value)} placeholder="Breed" required />
            <Input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
            <Button disabled={isSaving} type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Save cattle"}
            </Button>
          </form>

          {cattle.length > 0 && (
            <div className="mt-6 space-y-2">
              <Label htmlFor="selected-cattle">Selected cattle</Label>
              <select
                id="selected-cattle"
                value={selectedCattleId ?? ""}
                onChange={(event) => void handleCattleSelection(Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                {cattle.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.name} ({record.breed})
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Save diet plan</CardTitle>
            <CardDescription>Record the daily plan provided for the selected cattle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleDietPlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Fodder (kg/day)</Label><Input type="number" min="0.1" step="0.1" value={fodder} onChange={(event) => setFodder(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Concentrate (kg/day)</Label><Input type="number" min="0" step="0.1" value={concentrate} onChange={(event) => setConcentrate(event.target.value)} required /></div>
              </div>
              <Input value={supplements} onChange={(event) => setSupplements(event.target.value)} placeholder="Supplements (optional)" />
              <Input value={dietNotes} onChange={(event) => setDietNotes(event.target.value)} placeholder="Notes (optional)" />
              <Button disabled={isSaving || !selectedCattleId} type="submit" className="w-full bg-green-600 hover:bg-green-700"><Save className="size-4" /> Save diet plan</Button>
            </form>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="mb-2 text-sm font-medium text-green-800">Saved plans</p>
              {isLoading ? <Loader2 className="size-4 animate-spin text-green-700" /> : dietPlans.length === 0 ? <p className="text-sm text-green-800">No diet plan saved for this cattle yet.</p> : (
                <ul className="space-y-2 text-sm text-green-800">
                  {dietPlans.map((plan) => <li key={plan.id}>{plan.fodder_kg_per_day} kg fodder, {plan.concentrate_kg_per_day} kg concentrate per day{plan.supplements ? `, ${plan.supplements}` : ""}</li>)}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Save vaccination</CardTitle>
            <CardDescription>Record dates supplied by your veterinarian or local programme.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVaccinationSubmit} className="space-y-4">
              <Input value={vaccineName} onChange={(event) => setVaccineName(event.target.value)} placeholder="Vaccine name" required />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date administered</Label><Input type="date" value={administeredOn} onChange={(event) => setAdministeredOn(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Next due date</Label><Input type="date" value={nextDueOn} onChange={(event) => setNextDueOn(event.target.value)} required /></div>
              </div>
              <Input value={vaccinationNotes} onChange={(event) => setVaccinationNotes(event.target.value)} placeholder="Notes (optional)" />
              <Button disabled={isSaving || !selectedCattleId} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700"><CalendarDays className="size-4" /> Save vaccination</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-emerald-900">Due within 30 days</CardTitle>
          <CardDescription>Includes any records that are already overdue.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="size-5 animate-spin text-emerald-700" /> : upcomingVaccinations.length === 0 ? <p className="text-sm text-emerald-800">No upcoming vaccination records.</p> : (
            <ul className="space-y-3">
              {upcomingVaccinations.map((record) => {
                const recordCattle = cattle.find((item) => item.id === record.cattle_id)
                return <li key={record.id} className="rounded-lg bg-white p-3 text-sm text-emerald-900"><span className="font-semibold">{record.vaccine_name}</span> for {recordCattle?.name ?? "your cattle"}, due {formatDate(record.next_due_on)}</li>
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
