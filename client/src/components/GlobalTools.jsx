import { useState } from 'react';
import { usePreferences } from '../context/PreferencesContext.jsx';

export default function GlobalTools() {
  const { language, setLanguage, theme, setTheme, t } = usePreferences();
  const [helpOpen, setHelpOpen] = useState(false);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return <>
    <aside className="global-tools" aria-label={t('common.help')}>
      <button type="button" className="tool-button help-button" onClick={() => setHelpOpen(true)}>
        <span aria-hidden="true">?</span><span>{t('common.help')}</span>
      </button>
      <label className="language-tool">
        <span className="sr-only">{t('common.language')}</span>
        <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('common.language')}>
          <option value="ta">தமிழ்</option>
          <option value="tanglish">Tanglish</option>
          <option value="en">English</option>
        </select>
      </label>
      <button type="button" className="tool-button theme-button" onClick={() => setTheme(nextTheme)} aria-label={`${t('common.theme')}: ${t(`common.${nextTheme}`)}`}>
        <span aria-hidden="true">{nextTheme === 'light' ? '☼' : '☾'}</span><span>{t(`common.${nextTheme}`)}</span>
      </button>
    </aside>

    {helpOpen && <div className="help-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpOpen(false); }}>
      <section className="help-dialog animate-case-in" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <button type="button" className="help-close" onClick={() => setHelpOpen(false)} aria-label={t('common.close')}>×</button>
        <p className="case-eyebrow">AI MYSTERY ROOM · FIELD GUIDE</p>
        <h2 id="help-title">{t('help.title')}</h2>
        <p className="help-intro">{t('help.intro')}</p>
        <div className="help-steps">
          {[1, 2, 3, 4].map((step) => <article className="help-step" key={step}>
            <h3>{t(`help.step${step}.title`)}</h3>
            <p>{t(`help.step${step}.body`)}</p>
          </article>)}
        </div>
        <p className="help-tip">{t('help.tip')}</p>
      </section>
    </div>}
  </>;
}
