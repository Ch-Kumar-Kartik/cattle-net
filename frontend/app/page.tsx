"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, Scan, Stethoscope, Leaf, MapPin } from "lucide-react"

function Hero() {
  return (
    <section className="w-full min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient covering full area */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-blue-100" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 text-center space-y-8 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            AI-Powered Cattle Care
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-balance bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent leading-tight">
            Smart AI for Cattle Health & Breed Detection
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 text-pretty max-w-2xl mx-auto leading-relaxed">
            Transform your livestock management with cutting-edge AI technology. Upload a photo and get instant insights on breed identification, health assessment, and expert care recommendations.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Link href="/detect" className="flex items-center gap-2">
              <Camera className="size-5" />
              Upload Photo
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="px-8 py-3 rounded-full border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
            <Link href="/detect" className="flex items-center gap-2">
              <Scan className="size-5" />
              Try Demo
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xs">✓</span>
            </div>
            <span>99% Accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-xs">⚡</span>
            </div>
            <span>Instant Results</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xs">🛡</span>
            </div>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCards() {
  const features = [
    {
      title: "Breed Recognition",
      description: "Identify cattle & buffalo breeds instantly.",
      icon: Scan,
      href: "/detect",
      gradient: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Disease Detection",
      description: "AI-powered health check for your animals.",
      icon: Stethoscope,
      href: "/detect",
      gradient: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    },
    {
      title: "Feed & Nutrition",
      description: "Personalized diet and cost-effective feed plans.",
      icon: Leaf,
      href: "/tools",
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Nearby Veterinarians",
      description: "Find veterinary clinics and emergency services.",
      icon: MapPin,
      href: "/tools",
      gradient: "from-red-500 to-pink-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600"
    },
  ]

  return (
    <section className="w-full py-12 md:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Cattle Care Solutions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to ensure your livestock's health and productivity in one intelligent platform
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl transform transition-all duration-300 hover:scale-105"
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative bg-white">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <CardHeader className="p-8">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`size-8 ${feature.iconColor}`} />
                    </div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                    Learn more
                    <svg className="ml-2 size-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
                
                <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main>
      <header className="w-full px-4 md:px-6 py-3 md:py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-blue-600 p-1.5 text-white" aria-hidden="true">
              <Camera className="size-4" />
            </div>
            <span className="font-medium">CattleCare AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/detect" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Scan className="size-4" />
              Breed Recognition
            </Link>
            <Link href="/detect" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Stethoscope className="size-4" />
              Disease Detection
            </Link>
            <Link href="/tools" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Leaf className="size-4" />
              Feed & Nutrition
            </Link>
            <Link href="/tools" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <MapPin className="size-4" />
              Nearby Vets
            </Link>
          </nav>
          <div className="md:hidden" />
        </div>
      </header>

      <Hero />
      <FeatureCards />
    </main>
  )
}
