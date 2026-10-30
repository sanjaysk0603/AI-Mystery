import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../lib/api.js';

export default function NewCasePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    scenario: 'A necklace disappeared from a birthday party at a college hostel.',
    settings: { difficulty: 'medium', suspectCount: 4, language: 'en' },
  });
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await createCase(form);
      navigate(`/cases/${response.id}/generating`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/20 bg-slate-900/80 p-8 shadow-glow">
        <h1 className="mb-6 font-serif text-4xl text-amber-100">Create a new mystery</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Scenario</span>
            <textarea rows="5" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Difficulty</span>
              <select value={form.settings.difficulty} onChange={(e) => setForm({ ...form, settings: { ...form.settings, difficulty: e.target.value } })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Suspects</span>
              <input type="number" min="3" max="6" value={form.settings.suspectCount} onChange={(e) => setForm({ ...form, settings: { ...form.settings, suspectCount: Number(e.target.value) } })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
            </label>
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button type="submit" className="rounded-full bg-amber-500 px-6 py-3 font-medium text-slate-900">Create case</button>
        </form>
      </div>
    </main>
  );
}
