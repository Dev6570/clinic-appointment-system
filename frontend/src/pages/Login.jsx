import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { inputClass } from "../components/ui";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      setError("Incorrect username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient rail marks, echoing the status-rail motif used across the app */}
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-teal-400 via-amber-400 to-clay-400 opacity-70" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-teal-500 flex items-center justify-center mb-4 shadow-pop">
            <Stethoscope size={24} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-white">Clinic Desk</h1>
          <p className="text-ink-300 text-sm mt-1">Patient &amp; Appointment Suite</p>
        </div>

        <div className="bg-white rounded-2xl shadow-pop p-8">
          <h2 className="text-lg font-semibold text-ink-900 mb-1">Sign in</h2>
          <p className="text-sm text-ink-400 mb-6">Use your reception, doctor, or admin account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-ink-500 mb-1.5">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="e.g. reception1"
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-ink-500 mb-1.5">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-lg bg-clay-50 border border-clay-200 text-clay-500 text-sm px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 text-white font-medium py-2.5 hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-400 text-xs mt-6">
          Trouble signing in? Ask your clinic admin to confirm your account is active.
        </p>
      </div>
    </div>
  );
}
