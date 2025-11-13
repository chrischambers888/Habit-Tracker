import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  AUTH_COOKIE_NAME,
  credentialsMatch,
  getExpectedSessionToken,
  isAuthConfigured,
  verifySessionCookie,
} from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm, type LoginFormState } from "./login-form"

function resolveNextPath(candidate?: string) {
  if (!candidate || !candidate.startsWith("/")) {
    return "/habits"
  }

  return candidate
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string }
}) {
  const nextPath = resolveNextPath(searchParams?.next)

  if (!isAuthConfigured()) {
    redirect(nextPath)
  }

  const cookieStore = await cookies()
  const existingSession = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (await verifySessionCookie(existingSession)) {
    redirect(nextPath)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Access Habit Tracker</CardTitle>
          <CardDescription>
            Enter the credentials to continue to your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm action={authenticate} nextPath={nextPath} />
        </CardContent>
      </Card>
    </div>
  )
}

export async function authenticate(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  "use server"

  if (!isAuthConfigured()) {
    return { error: "Authentication is not configured." }
  }

  const username = formData.get("username")
  const password = formData.get("password")
  const next = formData.get("next")
  const nextPath = resolveNextPath(
    typeof next === "string" ? next : undefined,
  )

  if (typeof username !== "string" || typeof password !== "string") {
    return { error: "Please provide both username and password." }
  }

  const isValid = await credentialsMatch(username.trim(), password)

  if (!isValid) {
    return { error: "Invalid credentials. Try again." }
  }

  const sessionValue = await getExpectedSessionToken()

  if (!sessionValue) {
    return { error: "Unable to generate a session. Try again later." }
  }

  const cookieStore = await cookies()

  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: sessionValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect(nextPath)
}


