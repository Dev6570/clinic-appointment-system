import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { signup as signupRequest } from "../services/authService";
import { Field, inputClass } from "../components/ui";
import { getErrorMessage } from "../utils/errors";

const DEFAULT_ROUTE = {
  Admin: "/dashboard",
  Receptionist: "/dashboard",
  Doctor: "/schedule",
  Patient: "/my-portal",
};

const EMPTY_SIGNUP = {
  username: "",
  password: "",
  full_name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  address: "",
};

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup"

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [signupForm, setSignupForm] = useState(EMPTY_SIGNUP);
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const profile = await login(username, password);
      navigate(DEFAULT_ROUTE[profile.role] || "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Incorrect username or password. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  function handleSignupChange(e) {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  }

  function switchToLogin(prefillUsername) {
    setMode("login");
    setSignupForm(EMPTY_SIGNUP);
    setSignupError("");
    if (prefillUsername) setUsername(prefillUsername);
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);
    try {
      const payload = {
        ...signupForm,
        age: signupForm.age ? Number(signupForm.age) : null,
        phone: signupForm.phone || null,
        gender: signupForm.gender || null,
        address: signupForm.address || null,
      };
      await signupRequest(payload);
      notify("Account created. You can log in now.", "success");
      switchToLogin(signupForm.username);
    } catch (err) {
      setSignupError(getErrorMessage(err, "Couldn't create that account. Please try again."));
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 py-10 relative overflow-hidden">
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
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-50 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "login" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-600"
              }`}
            >
              <LogIn size={15} /> Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-600"
              }`}
            >
              <UserPlus size={15} /> Create account
            </button>
          </div>

          {mode === "login" ? (
            <>
              <h2 className="text-lg font-semibold text-ink-900 mb-1">Sign in</h2>
              <p className="text-sm text-ink-400 mb-6">Use your reception, doctor, patient, or admin account.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-medium text-ink-500 mb-1.5">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                    placeholder="Your username"
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
                      placeholder="********"
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
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p className="text-center text-ink-400 text-xs mt-6">
                Trouble signing in? Ask your clinic admin to confirm your account is active.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-ink-900 mb-1">Create a patient account</h2>
              <p className="text-sm text-ink-400 mb-6">
                For patients only. Staff and doctor logins are set up by the clinic admin.
              </p>

              <form onSubmit={handleSignupSubmit} className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name" span>
                  <input
                    name="full_name"
                    value={signupForm.full_name}
                    onChange={handleSignupChange}
                    className={inputClass}
                    placeholder="Full name"
                    required
                  />
                </Field>

                <Field label="Username">
                  <input
                    name="username"
                    value={signupForm.username}
                    onChange={handleSignupChange}
                    className={inputClass}
                    placeholder="At least 3 characters"
                    autoComplete="username"
                    required
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <input
                      type={signupShowPassword ? "text" : "password"}
                      name="password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      className={`${inputClass} pr-10`}
                      placeholder="8+ chars, letter & number"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setSignupShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
                      aria-label={signupShowPassword ? "Hide password" : "Show password"}
                    >
                      {signupShowPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </Field>

                <Field label="Email" hint="Used to find your existing record, if you have one.">
                  <input
                    type="email"
                    name="email"
                    value={signupForm.email}
                    onChange={handleSignupChange}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </Field>

                <Field label="Phone">
                  <input
                    name="phone"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                    className={inputClass}
                    placeholder="9876543210"
                    autoComplete="tel"
                  />
                </Field>

                <Field label="Age">
                  <input
                    type="number"
                    min="0"
                    name="age"
                    value={signupForm.age}
                    onChange={handleSignupChange}
                    className={inputClass}
                    placeholder="34"
                  />
                </Field>

                <Field label="Gender">
                  <select name="gender" value={signupForm.gender} onChange={handleSignupChange} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Address" span>
                  <input
                    name="address"
                    value={signupForm.address}
                    onChange={handleSignupChange}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </Field>

                {signupError && (
                  <div className="sm:col-span-2 rounded-lg bg-clay-50 border border-clay-200 text-clay-500 text-sm px-3 py-2.5">
                    {signupError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="sm:col-span-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 text-white font-medium py-2.5 hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-60"
                >
                  {signupLoading && <Loader2 size={16} className="animate-spin" />}
                  {signupLoading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="text-center text-ink-400 text-xs mt-6">
                Already have a record with the clinic? Use the same email or phone number and we'll link it automatically.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}