// Development-only entry. Vite builds index.html only; these controls never ship.
// The real App and its normal 15-second clock polling run unchanged.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/main';

const dateKey = 'moneta.qa.date';
function clock() { return new Date(`${sessionStorage.getItem(dateKey) || '2026-10-19'}T12:00:00`); }
function Controls() {
  const [date, setDate] = useState(sessionStorage.getItem(dateKey) || '2026-10-19');
  return <aside style={{ position: 'fixed', zIndex: 300, top: 1, right: 8, background: '#fff0c4', border: '1px solid #cfaa4c', borderRadius: 5, padding: '5px 9px', font: '10px Segoe UI', color: '#4d3909', display: 'flex', gap: 6, alignItems: 'center' }}>
    <strong>ТЕСТОВЫЕ ЧАСЫ: {date}</strong>
    {['2026-10-19', '2026-10-22', '2026-11-01'].map(value => <button key={value} onClick={() => { sessionStorage.setItem(dateKey, value); setDate(value); }} style={{ padding: '3px 6px', background: '#fff', border: '1px solid #cfaa4c', borderRadius: 3, fontSize: 9, color: '#4d3909' }}>{value}</button>)}
  </aside>;
}
createRoot(document.getElementById('qa-controls')).render(<Controls />);
createRoot(document.getElementById('root')).render(<React.StrictMode><App clock={clock} /></React.StrictMode>);
