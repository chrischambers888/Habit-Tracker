"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type LoginFormState = {
  error: string | null
}

type LoginFormProps = {
  action: (
    state: LoginFormState,
    formData: FormData,
  ) => Promise<LoginFormState>
  nextPath: string
}

const initialState: LoginFormState = {
  error: null,
}

export function LoginForm({ action, nextPath }: LoginFormProps) {
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form className="space-y-6" action={formAction}>
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  )
}


