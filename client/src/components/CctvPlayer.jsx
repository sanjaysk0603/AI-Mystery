import { useEffect, useState } from 'react';
import { usePreferences } from '../context/PreferencesContext.jsx';

export default function CctvPlayer({ camera, pinned = false, onTogglePin = () => {} }) {
  const { t } = usePreferences();
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = camera.frames[frameIndex];

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => setFrameIndex((index) => (index + 1) % camera.frames.length), 900);
    return () => clearInterval(timer);
  }, [playing, camera.frames.length]);

  return <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-4">
    <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm uppercase tracking-[0.2em] text-amber-300">{camera.cameraName} · {camera.location}</h3><button type="button" onClick={() => onTogglePin(camera.id)} className="text-xs text-amber-300 underline">{pinned ? t('cctv.unpin') : t('cctv.pin')}</button></div>
    <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-black">
      <img src={frame.imageUrl} alt={frame.caption} className="aspect-video w-full object-cover" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.24) 4px 5px)' }} />
      <div className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 font-mono text-xs text-amber-200">CAM {camera.id.toUpperCase()} · {frame.timestamp}</div>
      <p className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-sm text-slate-100">{frame.caption}</p>
    </div>
    <div className="mt-3 flex items-center gap-3">
      <button type="button" onClick={() => setPlaying((value) => !value)} className="rounded border border-slate-600 px-3 py-2 text-sm text-slate-100" aria-label={playing ? t('cctv.pause') : t('cctv.play')}>{playing ? t('cctv.pause') : t('cctv.play')}</button>
      <input aria-label={t('cctv.scrub', { camera: camera.cameraName })} type="range" min="0" max={camera.frames.length - 1} value={frameIndex} onChange={(event) => { setPlaying(false); setFrameIndex(Number(event.target.value)); }} className="min-w-0 flex-1 accent-amber-400" />
      <span className="font-mono text-xs text-slate-400">{frameIndex + 1}/{camera.frames.length}</span>
    </div>
  </section>;
}
