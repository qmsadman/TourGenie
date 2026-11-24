import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Globe2, Lock, Mail, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { referenceApi } from "../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countries, setCountries] = useState([]);
  const [countryCode, setCountryCode] = useState("BD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The picker is a nicety, not a gate: if the list can't load, the field
  // stays hidden and the account takes the server's default country.
  useEffect(() => {
    referenceApi
      .countries()
      .then(({ countries }) => {
        setCountries(countries || []);
        if (countries?.length && !countries.some((c) => c.code === "BD")) setCountryCode(countries[0].code);
      })
      .catch(() => setCountries([]));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, countries.length ? countryCode : undefined);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't create your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      headline="Start your TourGenie account."
      sub="Create an account to keep your saved trips together."
    >
      <h1 className="font-display text-2xl text-paper mb-1">Create account</h1>
      <p className="text-sm text-paper/50 mb-6">It only takes a moment to get started.</p>

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-sunset/10 border border-sunset/30 text-sunset text-sm rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-paper/60 mb-1.5 block">Name</span>
          <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-lg px-3 focus-within:border-teal">
            <UserRound className="w-4 h-4 text-paper/30" />
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="bg-transparent text-paper text-sm py-2.5 w-full focus:outline-none placeholder:text-paper/30"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-paper/60 mb-1.5 block">Email</span>
          <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-lg px-3 focus-within:border-teal">
            <Mail className="w-4 h-4 text-paper/30" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="bg-transparent text-paper text-sm py-2.5 w-full focus:outline-none placeholder:text-paper/30"
            />
          </div>
        </label>
        {countries.length > 0 && (
          <label className="block">
            <span className="text-sm font-medium text-paper/60 mb-1.5 block">Country</span>
            <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-lg px-3 focus-within:border-teal">
              <Globe2 className="w-4 h-4 text-paper/30" />
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                autoComplete="country"
                className="bg-transparent text-paper text-sm py-2.5 w-full focus:outline-none cursor-pointer"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code} className="bg-ink-900 text-paper">
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium text-paper/60 mb-1.5 block">Password</span>
          <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-lg px-3 focus-within:border-teal">
            <Lock className="w-4 h-4 text-paper/30" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="bg-transparent text-paper text-sm py-2.5 w-full focus:outline-none placeholder:text-paper/30"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sunset hover:bg-sunset-dark disabled:opacity-60 text-ink-fixed font-semibold text-sm py-3 rounded-lg transition-colors"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-paper/50 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-teal hover:text-teal-dark">Log in</Link>
      </p>
    </AuthLayout>
  );
}
