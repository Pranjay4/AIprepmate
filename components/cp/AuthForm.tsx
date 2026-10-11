"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useCP } from "@/lib/cp/store";
import { Logo } from "@/components/layout/AppShell";
import { Button, Field, Input, Notice } from "@/components/cp/ui";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 characters).").max(60, "Keep your name under 60 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { signUp, logIn, enterDemo } = useCP();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsed = (mode === "signup" ? signupSchema : loginSchema).safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(values);
        router.push("/onboarding");
      } else {
        await logIn(values.email, values.password);
        router.push("/dashboard");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    try {
      await enterDemo();
      router.push("/dashboard");
    } catch {
      setFormError("Could not start the demo. Check that browser storage is enabled.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6"><Logo /></Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold tracking-tight">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="text-sm text-muted mt-1">{mode === "signup" ? "Set up a preparation plan in about two minutes." : "Log in to continue your preparation."}</p>

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          {mode === "signup" && (
            <Field label="Full name" htmlFor="name" error={errors.name}>
              <Input id="name" autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name} />
            </Field>
          )}
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} aria-invalid={!!errors.email} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password} hint={mode === "signup" ? "At least 8 characters." : undefined}>
            <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={values.password} onChange={set("password")} aria-invalid={!!errors.password} />
          </Field>
          {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] text-muted">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="secondary" onClick={demo} disabled={busy} className="w-full">Continue with the demo account</Button>

        <p className="mt-5 text-sm text-muted text-center">
          {mode === "signup" ? (
            <>Already have an account? <Link href="/login" className="text-accent font-medium hover:underline">Log in</Link></>
          ) : (
            <>New here? <Link href="/signup" className="text-accent font-medium hover:underline">Create an account</Link></>
          )}
        </p>
      </div>
      <div className="w-full max-w-sm mt-4">
        <Notice tone="neutral">
          Demo mode: accounts are stored only in this browser and are not shared across devices. We ask only for a name, email and password.
        </Notice>
      </div>
    </div>
  );
}
