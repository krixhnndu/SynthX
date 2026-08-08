import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import Button from "../components/ui/Button";
import { Label, TextInput } from "../components/ui/Inputs";
import { Eyebrow, ErrorNote } from "../components/ui/Primitives";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "That email and password don't match an account."
          : "Sign-in is unavailable right now. Try again in a moment."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      {/* Left plate: identity only. No marketing, no illustration. */}
      <div className="relative hidden flex-col justify-between border-r border-rule bg-surface p-12 lg:flex">
        <div>
          <div className="font-display text-3xl leading-none tracking-tight text-ink">ClausePilot</div>
          <Eyebrow className="mt-2">Contract Intelligence &amp; Approval</Eyebrow>
        </div>

        <div className="max-w-md">
          <p className="font-display text-2xl leading-snug text-ink">
            Every contract is read, weighed and recorded before anyone signs.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Eight review stages run on upload. A human decision closes the case.
            Every step is written to the audit trail.
          </p>
        </div>

        <div className="flex gap-px" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-rule" />
          ))}
        </div>
      </div>

      <div className="grid place-items-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <div className="font-display text-2xl leading-none text-ink">ClausePilot</div>
            <Eyebrow className="mt-1.5 mb-8">Contract Intelligence &amp; Approval</Eyebrow>
          </div>

          <h1 className="font-display text-2xl text-ink">Sign in</h1>
          <p className="mb-8 mt-1 text-sm text-muted">Open the cases assigned to you.</p>

          <Label htmlFor="email">Email</Label>
          <TextInput
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4"
          />

          <Label htmlFor="password">Password</Label>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            className="mb-6"
          />

          {error && <ErrorNote className="mb-5">{error}</ErrorNote>}

          <Button
            variant="primary"
            onClick={handleSignIn}
            disabled={busy || !email || !password}
            className="w-full"
          >
            {busy ? "Signing in" : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
