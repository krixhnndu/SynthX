import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSignIn() {
    setError(null);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "That email and password don't match an account."
          : "Sign-in is unavailable right now. Try again in a moment."
      );
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl mb-1">Contract review</h1>
        <p className="text-sm text-ink/60 mb-8">Sign in to open your cases.</p>

        <label className="block text-xs font-medium mb-1">Email</label>
        <input
          className="w-full border border-rule rounded px-3 py-2 mb-4 bg-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <label className="block text-xs font-medium mb-1">Password</label>
        <input
          className="w-full border border-rule rounded px-3 py-2 mb-6 bg-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
        />

        {error && <p className="text-sm text-severity-critical mb-4">{error}</p>}

        <button
          onClick={handleSignIn}
          className="w-full bg-ink text-paper py-2.5 rounded font-medium"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
