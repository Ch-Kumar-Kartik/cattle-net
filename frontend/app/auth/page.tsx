"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { AlertCircle, Camera, Loader2, LogIn, UserPlus } from "lucide-react"

import { AuthApiError, loginUser, registerUser, setAccessToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "login" | "register"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isLogin = mode === "login"

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) {
      return
    }

    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      if (isLogin) {
        const response = await loginUser(email, password)
        setAccessToken(response.access_token)
        router.push("/detect")
        return
      }

      await registerUser(email, password)
      setPassword("")
      setMode("login")
      setNotice("Account created. Sign in with your new credentials.")
    } catch (caughtError) {
      if (caughtError instanceof AuthApiError) {
        setError(caughtError.message)
      } else if (caughtError instanceof Error) {
        setError(caughtError.message)
      } else {
        setError("Something went wrong while processing your request.")
      }
    } finally {
      setLoading(false)
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setError(null)
    setNotice(null)
    setPassword("")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-10 md:px-6">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <Card className="w-full overflow-hidden border-0 bg-white/90 shadow-xl backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600" />
          <CardHeader className="space-y-5 text-center">
            <Link className="mx-auto flex w-fit items-center gap-2 text-gray-900" href="/">
              <span className="rounded-xl bg-blue-600 p-2 text-white shadow-lg">
                <Camera className="size-5" />
              </span>
              <span className="font-semibold">CattleCare AI</span>
            </Link>
            <div>
              <CardTitle className="text-2xl text-gray-900">
                {isLogin ? "Welcome back" : "Create your account"}
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                {isLogin
                  ? "Sign in to analyze cattle images and view your history."
                  : "Register to save your cattle breed predictions."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1">
              <Button
                className="rounded-md"
                onClick={() => switchMode("login")}
                type="button"
                variant={isLogin ? "default" : "ghost"}
              >
                Sign in
              </Button>
              <Button
                className="rounded-md"
                onClick={() => switchMode("register")}
                type="button"
                variant={isLogin ? "ghost" : "default"}
              >
                Register
              </Button>
            </div>

            {error && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">
                {notice}
              </div>
            )}

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : isLogin ? (
                  <>
                    <LogIn className="mr-2 size-4" />
                    Sign in
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 size-4" />
                    Create account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
