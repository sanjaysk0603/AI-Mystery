import { Link } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext.jsx';

export default function LandingPage() {
  const { t } = usePreferences();
  return (
    <main className="case-shell landing-page min-h-screen bg-slate-950 px-4 py-8 pb-32 text-slate-100 sm:py-10 sm:pb-24">
      <div className="mx-auto max-w-5xl">
        <header className="landing-header mb-7 flex flex-wrap items-center justify-between gap-3 sm:mb-10 sm:gap-4">
          <div className="landing-brand text-lg font-semibold tracking-[0.14em] text-amber-300 sm:text-xl sm:tracking-[0.22em]">AI MYSTERY ROOM</div>
          <div className="flex gap-2 sm:gap-3">
            <Link to="/login" className="rounded-full border border-amber-500/40 px-3 py-2 text-sm hover:bg-amber-500/10 sm:px-5">{t('landing.login')}</Link>
            <Link to="/register" className="rounded-full bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900 sm:px-5">{t('landing.register')}</Link>
          </div>
        </header>

        <section className="landing-hero animate-case-in grid gap-6 rounded-3xl border border-amber-500/20 bg-slate-900/70 p-5 shadow-glow sm:gap-8 sm:p-8 lg:grid-cols-2">
          <div className="space-y-5 sm:space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">{t('landing.eyebrow')}</p>
            <h1 className="landing-title max-w-2xl font-serif text-4xl leading-[1.08] text-amber-100 sm:text-6xl">{t('landing.title')}</h1>
            <p className="max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">{t('landing.description')}</p>
            <div className="landing-actions flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link to="/register" className="rounded-full bg-amber-500 px-5 py-3 text-center font-medium text-slate-900 sm:px-6">{t('landing.start')}</Link>
              <Link to="/dashboard" className="rounded-full border border-slate-600 px-5 py-3 text-center text-slate-200 sm:px-6">{t('landing.browse')}</Link>
            </div>
          </div>

          <div className="landing-sample rounded-2xl border border-slate-700 bg-slate-950/60 p-4 sm:p-5">
            <div className="detective-art" aria-hidden="true">
              <svg viewBox="0 0 420 170" role="presentation">
                <path d="M35 137h350M77 137V48h266v89M96 68h82v58H96zM242 68h82v58h-82zM103 75l68 44m0-44-68 44m147-44 68 44m0-44-68 44" />
                <circle className="lens-orbit" cx="210" cy="76" r="31" /><path className="lens-handle" d="m232 99 28 28" />
                <path d="M192 76h36m-18-18v36M210 137v-15m-10 15h20" />
              </svg>
            </div>
            <div className="mb-4 text-xs uppercase tracking-[0.22em] text-slate-400">{t('landing.example')}</div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>{t('landing.sample')}</p>
              <div className="evidence-card rounded-lg bg-slate-800 p-3 text-slate-100">
                <div className="text-xs uppercase text-amber-300">{t('investigation.caseFile')}</div>
                <div className="mt-2 font-serif text-2xl text-amber-100">{t('landing.caseTitle')}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
