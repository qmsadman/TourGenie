import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      headline="Plan the whole trip, not just the flight."
      sub="Log in to see and manage your saved trips."
    >
      <h1 className="font-display text-2xl text-paper mb-1">Welcome back</h1>
      <p className="text-sm text-paper/50 mb-6">Log in to continue to your dashboard.</p>

      {error && (
        <div className="flex items-start gap-2 bg-sunset/10 border border-sunset/30 text-sunset text-sm rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-paper/60 mb-1.5 block">Email</span>
          <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-lg px-3 focus-within:border-teal">
            <Mail className="w-4 h-4 text-paper/30" />
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="bg-transparent text-paper text-sm py-2.5 w-full focus:outline-none placeholder:text-paper/30"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-paper/60 mb-1.5 block">Password</span>
          <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-lg px-3 focus-within:border-teal">
            <Lock className="w-4 h-4 text-paper/30" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="bg-transparent text-paper text-sm py-2.5 w-full focus:outline-none placeholder:text-paper/30"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sunset hover:bg-sunset-dark disabled:opacity-60 text-ink-fixed font-semibold text-sm py-3 rounded-lg transition-colors"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-center text-sm text-paper/50 mt-6">
        New to TourGenie?{" "}
        <Link to="/register" className="text-teal hover:text-teal-dark">Create an account</Link>
      </p>
      <p className="text-center text-xs text-paper/40 mt-4">
        <Link to="/" className="hover:text-paper/70">Back to home</Link>
      </p>
    </AuthLayout>
  );
}
