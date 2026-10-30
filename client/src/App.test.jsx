import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ user: null }) })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the landing page when not authenticated', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Every clue has a story/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How to play/i })).toBeInTheDocument();
  });

  it('changes app language, opens the play guide, and switches theme', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'ta' } });
    expect(screen.getByText(/ஒவ்வொரு தடயத்துக்கும்/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /விளையாடுவது எப்படி/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent('விசாரணையாளரே');
    fireEvent.click(screen.getByRole('button', { name: 'மூடு' }));

    fireEvent.click(screen.getByRole('button', { name: /தோற்றம்: வெளிச்சம்/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
