import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="theme-ink sticky top-0 z-40 bg-ink-900/95 backdrop-blur border-b border-ink-700">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-paper">
          <Compass className="w-6 h-6 text-sunset" strokeWidth={1.75} />
          <span className="font-display text-lg tracking-tight">
            TourGenie <span className="text-sunset">AI</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-paper/80 hover:text-paper">Features</a>
          <a href="#about" className="text-sm font-medium text-paper/80 hover:text-paper">About</a>
        </nav>
        <Link
          to={user ? "/dashboard" : "/login"}
          className="text-sm font-semibold bg-sunset hover:bg-sunset-dark text-ink-fixed px-4 py-2 rounded-full transition-colors"
        >
          {user ? "Dashboard" : "Log in"}
        </Link>
      </div>
    </header>
  );
}
