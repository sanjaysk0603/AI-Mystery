import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-[0.22em] text-amber-300">AI MYSTERY ROOM</div>
          <div className="flex gap-3">
            <Link to="/login" className="rounded-full border border-amber-500/40 px-5 py-2 text-sm hover:bg-amber-500/10">Login</Link>
            <Link to="/register" className="rounded-full bg-amber-500 px-5 py-2 text-sm font-medium text-slate-900">Create account</Link>
          </div>
        </header>

        <section className="grid gap-8 rounded-3xl border border-amber-500/20 bg-slate-900/70 p-8 shadow-glow lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Case file // v1</p>
            <h1 className="font-serif text-5xl leading-tight text-amber-100">Unravel a fiction-crafted mystery.</h1>
            <p className="max-w-lg text-lg text-slate-300">Turn a short prompt into a noir-style investigation: suspects, alibis, hidden clues, CCTV, and a final verdict.</p>
            <div className="flex gap-4">
              <Link to="/register" className="rounded-full bg-amber-500 px-6 py-3 font-medium text-slate-900">Start a case</Link>
              <Link to="/dashboard" className="rounded-full border border-slate-600 px-6 py-3 text-slate-200">Browse cases</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
            <div className="mb-4 text-xs uppercase tracking-[0.22em] text-slate-400">Example teaser</div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>“A necklace disappeared during a birthday party in a college hostel. Everyone had a reason to hide something.”</p>
              <div className="rounded-lg bg-slate-800 p-3 text-slate-100">
                <div className="text-xs uppercase text-amber-300">Case title</div>
                <div className="mt-2 font-serif text-2xl text-amber-100">The Hostel Heist</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
