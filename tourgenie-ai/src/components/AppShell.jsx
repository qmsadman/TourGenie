import { Link } from "react-router-dom";
import { Compass, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AppShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink-900">
      <header className="border-b border-sand bg-surface">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg">
            <Compass className="w-5 h-5 text-teal-dark" />
            TourGenie <span className="text-sunset">AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-ink-600">{user?.name}</span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-sunset-dark"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900">{title}</h1>
          {subtitle && <p className="text-ink-600 mt-2">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
