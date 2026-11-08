import { Link } from "react-router-dom";
import {
  Search,
  Sparkles,
  Compass,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  ArrowRight,
  Star,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RouteLine from "../components/RouteLine";
import Reveal from "../components/ui/Reveal";

const features = [
  {
    icon: Compass,
    title: "A clear place to start",
    desc: "The home page introduces TourGenie and helps you get to your account.",
  },
  {
    icon: LockKeyhole,
    title: "One simple login",
    desc: "Sign in once to reach the trips saved to your account.",
  },
  {
    icon: MapPinned,
    title: "Your trips at a glance",
    desc: "The dashboard shows each saved trip's destination, dates, and travelers.",
  },
];

const steps = [
  { n: "1", title: "Start at home", desc: "Get a quick introduction to the TourGenie app." },
  { n: "2", title: "Log in", desc: "Use your account to continue securely." },
  { n: "3", title: "Review your trips", desc: "See saved destinations, dates, and traveler counts on your dashboard." },
];

export default function Landing() {
  return (
    <div className="bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="theme-ink relative bg-ink-900 bg-ink-glow overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-28 relative z-10">
          {/* stagger, not one fade-up on the block: the hero has a reading
              order — badge, headline, promise, the thing you type into — and
              letting it arrive in that order is the difference between a page
              appearing and a page introducing itself. */}
          {/* scroll-fade on the wrapper, not on the staggered block itself:
              two animations on one element and the last one declared wins. */}
          <div className="scroll-fade">
          <div className="max-w-2xl stagger">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-sunset bg-sunset/10 border border-sunset/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Powered by AI
            </span>
            <h1 className="font-display text-display-lg text-paper mt-6">
              From leaving home to
              <br />
              coming back — <span className="text-sunset italic">planned</span>.
            </h1>
            <p className="text-paper/70 text-lg mt-6 max-w-lg leading-relaxed">
              TourGenie gives you a clear starting point for your travel plans
              and a dashboard to keep saved trip details close at hand.
            </p>

            <form className="mt-10 bg-ink-800/90 backdrop-blur border border-ink-700 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl focus-within:border-teal/50 transition-colors">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-paper/40 shrink-0" />
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  className="bg-transparent text-paper placeholder:text-paper/40 text-sm py-3 w-full focus:outline-none"
                />
              </div>
              <Link
                to="/login"
                className="bg-sunset hover:bg-sunset-dark text-ink-fixed font-semibold text-sm px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition hover:shadow-glow shrink-0 active:scale-[0.98]"
              >
                Log in to get started <ArrowRight className="w-4 h-4" />
              </Link>
            </form>

            <div className="mt-6 flex items-center gap-2 text-paper/50 text-sm">
              <RouteLine className="w-24 h-4" color="#EF8354" />
              Dhaka → Cox&apos;s Bazar → Himchari → back home
            </div>

            {/* What's actually in the catalogue — real numbers, not vanity ones */}
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {[
                ["27", "destinations"],
                ["87", "attractions"],
                ["36", "hotels"],
                ["5", "languages"],
              ].map(([n, label]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span className="font-display text-3xl text-paper tabular-nums">{n}</span>
                  <span className="text-xs text-paper/50 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* decorative route line across hero bottom */}
        <svg className="absolute bottom-0 left-0 w-full h-24 opacity-40 animate-drift" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 80 Q 300 10, 600 60 T 1200 40" fill="none" stroke="#1C8C82" strokeWidth="2" strokeDasharray="1 10" strokeLinecap="round" />
        </svg>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="max-w-xl mb-14">
          <p className="text-xs font-semibold tracking-wide uppercase text-teal mb-3">What it does</p>
          <h2 className="font-display text-3xl md:text-4xl text-ink-900">
            Every planning tool a trip needs, already talking to each other.
          </h2>
        </Reveal>
        <Reveal stagger className="grid sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group card p-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-light to-teal/25 flex items-center justify-center mb-4 transition-transform duration-base group-hover:scale-110 group-hover:-rotate-3">
                <f.icon className="w-5 h-5 text-teal-dark" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg text-ink-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* How it works */}
      <section className="bg-teal-light/50 border-y border-sand">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-xs font-semibold tracking-wide uppercase text-teal mb-3">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 mb-14 max-w-xl">
              Three simple pages to reach your saved trips.
            </h2>
          </Reveal>
          <Reveal stagger className="relative grid md:grid-cols-3 gap-10">
            <div className="hidden md:block absolute top-6 left-0 right-0">
              <RouteLine className="w-full h-4" color="#1C8C82" />
            </div>
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="w-12 h-12 rounded-full bg-ink-900 text-paper font-display flex items-center justify-center text-lg mb-5 relative z-10">
                  {s.n}
                </div>
                <h3 className="font-semibold text-ink-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Dashboard teaser */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-wide uppercase text-teal mb-3">Your dashboard</p>
          <h2 className="font-display text-3xl text-ink-900 mb-4">
            Keep your saved trips together.
          </h2>
          <p className="text-ink-600 leading-relaxed mb-6">
            Sign in to see trip destinations, travel dates, and traveler counts
            in one place.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 text-teal-dark font-semibold text-sm hover:gap-3 transition-[gap] duration-base ease-tg-out">
            Go to your dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
        <Reveal className="relative">
          <div className="absolute -top-3 -left-3 w-full h-full rounded-2xl bg-teal-light/60 -rotate-1" aria-hidden />
          <div className="relative card shadow-lift p-6 animate-drift">
            <div className="flex items-center gap-1 text-gold mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-gold" />)}
            </div>
            <p className="text-ink-900/80 leading-relaxed mb-4 font-display text-lg italic">
              "I can quickly check where we're going, when we're leaving, and
              who's traveling with me."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal to-teal-dark text-paper-fixed flex items-center justify-center text-xs font-bold">FR</div>
              <p className="text-sm font-semibold text-ink-900">Farhana R. <span className="font-normal text-ink-500">— Cox's Bazar</span></p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="theme-ink bg-ink-900 bg-ink-glow relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center relative z-10">
          <ShieldCheck className="w-8 h-8 text-sunset mx-auto mb-5" strokeWidth={1.5} />
            <h2 className="font-display text-3xl md:text-4xl text-paper mb-4">
            Your trips, in one dashboard.
          </h2>
          <p className="text-paper/60 max-w-md mx-auto mb-8">
            Log in to view the trips saved to your account.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-sunset hover:bg-sunset-dark text-ink-fixed font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Go to login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
