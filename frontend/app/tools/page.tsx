"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Syringe, Salad, MapPin, Search, Loader2 } from "lucide-react"

function VaccinationReminder() {
  const [breed, setBreed] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [lastDate, setLastDate] = useState("")

  const schedule = useMemo(() => {
    if (!breed || !age || !lastDate) return null
    const dueInDays = Math.max(0, 180 - (Number(age) % 180))
    return {
      nextDue: dueInDays,
      notes: `Based on ${breed} at ${age} months. Consult local guidelines.`,
    }
  }, [breed, age, lastDate])

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden h-full">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2" />
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Syringe className="size-6 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-900">Vaccination Reminder</CardTitle>
            <CardDescription className="text-gray-600">
              Generate a personalized vaccination schedule
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="v-breed" className="text-sm font-medium text-gray-700">Breed</Label>
            <Input 
              id="v-breed" 
              placeholder="e.g., Sahiwal" 
              value={breed} 
              onChange={(e) => setBreed(e.target.value)}
              className="rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="v-age" className="text-sm font-medium text-gray-700">Age (months)</Label>
              <Input
                id="v-age"
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                className="rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-last" className="text-sm font-medium text-gray-700">Last Vaccination</Label>
              <Input 
                id="v-last" 
                type="date" 
                value={lastDate} 
                onChange={(e) => setLastDate(e.target.value)}
                className="rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <Button 
          disabled={!breed || !age || !lastDate}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Generate Schedule
        </Button>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-emerald-700 font-medium mb-1">Next Due</div>
              <div className="text-lg font-bold text-emerald-800">{schedule ? `${schedule.nextDue} days` : "—"}</div>
            </div>
            <div>
              <div className="text-sm text-emerald-700 font-medium mb-1">Status</div>
              <div className="text-lg font-bold text-emerald-800">
                {schedule ? (schedule.nextDue <= 30 ? "Due Soon" : "On Track") : "—"}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-emerald-700 font-medium mb-1">Notes</div>
            <div className="text-sm text-emerald-800">{schedule ? schedule.notes : "Fill in the details above to generate a vaccination schedule"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NutritionCalculator() {
  const [breed, setBreed] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [weight, setWeight] = useState<number | "">("")
  const [milk, setMilk] = useState<number | "">("")

  const plan = useMemo(() => {
    if (!breed || !age || !weight) return null
    const wt = Number(weight)
    const maintenanceFodderKg = Math.max(3, wt * 0.02) // 2% of body weight
    const concentrateKg = milk ? Number(milk) * 0.4 : 1
    const supplements = "Mineral mix 50g, salt 30g"
    return {
      fodder: maintenanceFodderKg.toFixed(1),
      concentrate: concentrateKg.toFixed(1),
      supplements,
      notes: `Auto plan for ${breed}, ${age} mo, ~${wt} kg${milk ? `, ${milk} L/day` : ""}.`,
    }
  }, [breed, age, weight, milk])

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden h-full">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2" />
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <Salad className="size-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-900">Nutrition Calculator</CardTitle>
            <CardDescription className="text-gray-600">
              Get personalized daily feed recommendations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n-breed" className="text-sm font-medium text-gray-700">Breed</Label>
              <Input 
                id="n-breed" 
                placeholder="e.g., Murrah" 
                value={breed} 
                onChange={(e) => setBreed(e.target.value)}
                className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-age" className="text-sm font-medium text-gray-700">Age (months)</Label>
              <Input
                id="n-age"
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n-weight" className="text-sm font-medium text-gray-700">Weight (kg)</Label>
              <Input
                id="n-weight"
                type="number"
                min={0}
                value={weight}
                onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-milk" className="text-sm font-medium text-gray-700">Milk Yield (L/day)</Label>
              <Input
                id="n-milk"
                type="number"
                min={0}
                value={milk}
                onChange={(e) => setMilk(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Optional"
                className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <Button 
          disabled={!breed || !age || !weight}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Calculate Nutrition Plan
        </Button>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-green-700 font-medium mb-1">Fodder (kg/day)</div>
              <div className="text-lg font-bold text-green-800">{plan ? plan.fodder : "—"}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-green-700 font-medium mb-1">Concentrate (kg/day)</div>
              <div className="text-lg font-bold text-green-800">{plan ? plan.concentrate : "—"}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-green-700 font-medium mb-1">Supplements</div>
              <div className="text-sm font-medium text-green-800">{plan ? plan.supplements : "—"}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-green-700 font-medium mb-1">Notes</div>
            <div className="text-sm text-green-800">{plan ? plan.notes : "Fill in the cattle details above to get a personalized nutrition plan"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NearbyVetMap() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [manualLocation, setManualLocation] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [locationName, setLocationName] = useState("")

  // Auto-detect location on component mount
  useEffect(() => {
    autoDetectLocation()
  }, [])

  const autoDetectLocation = async () => {
    setIsLoading(true)
    try {
      // First try to get user's approximate location using IP geolocation
      const ipResponse = await fetch('https://ipapi.co/json/')
      const ipData = await ipResponse.json()
      
      if (ipData.latitude && ipData.longitude) {
        setUserLocation({
          lat: parseFloat(ipData.latitude),
          lng: parseFloat(ipData.longitude)
        })
        setLocationName(`${ipData.city}, ${ipData.region}`)
        setLocationError(null)
      } else {
        // Fallback to a default location (you can change this to your preferred default)
        setUserLocation({
          lat: 28.6139, // New Delhi coordinates as fallback
          lng: 77.2090
        })
        setLocationName("New Delhi, India (Default)")
      }
    } catch (error) {
      // If IP geolocation fails, use default location
      setUserLocation({
        lat: 28.6139, // New Delhi coordinates
        lng: 77.2090
      })
      setLocationName("New Delhi, India (Default)")
    }
    setIsLoading(false)
  }

  const getCurrentLocation = () => {
    setIsLoading(true)
    setLocationError(null)
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.")
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationName("Your precise location")
        setLocationError(null)
        setIsLoading(false)
      },
      (error) => {
        let errorMessage = ""
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "GPS access denied. Using approximate location instead."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS unavailable. Using approximate location instead."
            break
          case error.TIMEOUT:
            errorMessage = "GPS timeout. Using approximate location instead."
            break
          default:
            errorMessage = "GPS failed. Using approximate location instead."
        }
        setLocationError(errorMessage)
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return
    
    setIsLoading(true)
    try {
      // Use Google Geocoding API to convert address to coordinates
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(manualLocation)}&key=AIzaSyC0b3StZVVjos7V55thHflDFxyKS_gbGpg`)
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        setUserLocation({
          lat: location.lat,
          lng: location.lng
        })
        setLocationName(data.results[0].formatted_address)
        setLocationError(null)
      } else {
        setLocationError("Location not found. Please try a different address.")
      }
    } catch (error) {
      setLocationError("Error finding location. Please try again.")
    }
    setIsLoading(false)
  }

  const searchNearbyVets = () => {
    if (userLocation) {
      const query = `veterinary+clinic+near+${userLocation.lat},${userLocation.lng}`
      const googleMapsUrl = `https://www.google.com/maps/search/${query}`
      window.open(googleMapsUrl, '_blank')
    }
  }

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2" />
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <MapPin className="size-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-900">Find Nearby Veterinarians</CardTitle>
            <CardDescription className="text-gray-600">
              Locate veterinary clinics and animal hospitals in your area
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Location Status */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Your Location</h3>
              <p className="text-sm text-gray-600">
                {userLocation 
                  ? `Located at ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                  : "Detect your location automatically or enter manually"
                }
              </p>
            </div>
            <Button 
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <MapPin className="size-4 mr-2" />
                  Get Location
                </>
              )}
            </Button>
          </div>
          
          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700 mb-2">{locationError}</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your city, state or address"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="flex-1 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                />
                <Button 
                  onClick={handleManualLocation}
                  disabled={isLoading || !manualLocation.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Search
                </Button>
              </div>
            </div>
          )}
          
          {!userLocation && !locationError && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                💡 <strong>Tip:</strong> For best results, allow location access or enter your city/address manually
              </p>
            </div>
          )}
        </div>

        {/* Google Maps Integration */}
        <div className="bg-gray-100 rounded-xl overflow-hidden" style={{height: '400px'}}>
          {userLocation ? (
            <iframe
              src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyC0b3StZVVjos7V55thHflDFxyKS_gbGpg&q=veterinary+clinic&center=${userLocation.lat},${userLocation.lng}&zoom=12`}
              width="100%"
              height="100%"
              style={{border: 0}}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Nearby Veterinary Clinics"
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center max-w-md px-6">
                <div className="p-4 bg-blue-600 rounded-full w-fit mx-auto mb-4">
                  <MapPin className="size-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Location Required</h3>
                <p className="text-gray-600 mb-4">
                  Enable location access or enter your address manually to find nearby veterinary clinics
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full"
                  >
                    {isLoading ? "Getting Location..." : "Try Location Again"}
                  </Button>
                  <div className="text-sm text-gray-500">
                    Or scroll up to enter your location manually
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Button 
            onClick={searchNearbyVets}
            disabled={!userLocation}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg p-4 h-auto flex-col gap-2"
          >
            <MapPin className="size-5" />
            Search on Google Maps
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open('tel:emergency-vet-number', '_self')}
            className="border-red-300 text-red-700 hover:bg-red-50 rounded-lg p-4 h-auto flex-col gap-2"
          >
            <Phone className="size-5" />
            Emergency Call
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open('https://www.petvet.com/find-a-vet', '_blank')}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg p-4 h-auto flex-col gap-2"
          >
            <Syringe className="size-5" />
            Find 24/7 Clinics
          </Button>
        </div>

        {/* Emergency Information */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-yellow-500 rounded-full flex-shrink-0 mt-1">
              <span className="block w-2 h-2 bg-white rounded-full"></span>
            </div>
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Emergency Veterinary Hotline</h4>
              <p className="text-sm text-yellow-700">
                For critical emergencies: <strong>1-800-VET-HELP</strong><br />
                Available 24/7 for immediate cattle health emergencies
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="w-full px-4 md:px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-2 text-white shadow-lg">
              <Syringe className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Health Tools
              </h1>
              <p className="text-sm text-gray-600">Comprehensive cattle care management</p>
            </div>
          </div>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </header>

      <div className="px-4 md:px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          
          {/* Page Description */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Cattle Care Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced tools for vaccination scheduling, nutrition planning, and emergency assistance
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <VaccinationReminder />
            <NutritionCalculator />
            <div className="lg:col-span-2">
              <NearbyVetMap />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
