import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function Footer() {
  return (
    <footer id="about" className="theme-ink bg-ink-900 text-paper/70 border-t border-ink-700">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-paper mb-2">
            <Compass className="w-5 h-5 text-sunset" strokeWidth={1.75} />
            <span className="font-display text-base">TourGenie AI</span>
          </div>
          <p className="text-sm">A simple home, login, and saved-trips dashboard.</p>
        </div>
        <Link to="/login" className="text-sm font-semibold text-sunset hover:text-paper">
          Log in
        </Link>
      </div>
      <div className="border-t border-ink-700 py-4 text-center text-xs text-paper/50">
        TourGenie AI
      </div>
    </footer>
  );
}
