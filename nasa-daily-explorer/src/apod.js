// src/apod.js
import { $, show, hide, openModal } from './ui.js';

// --- API config (your key) ---
const API_KEY = 'sKFtJEmy8JWNkrSD5jPeiiRldbcMzVzpwyyTuixc'; // your NASA key
const APOD_URL_BASE = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

// Small helpers
const q = (sel) => document.querySelector(sel);
const pick = (...selectors) =>
  selectors
    .map((s) => (s.startsWith('#') || s.startsWith('.')) ? q(s) : document.getElementById(s))
    .find(Boolean);

// Grab whichever IDs/classes you happen to have in your HTML
function getEls() {
  return {
    card:        pick('apodCard'),
    mediaWrap:   pick('mediaWrap', '.media-container'),
    title:       pick('title', 'apod-title'),
    date:        pick('date', 'apod-date'),
    desc:        pick('desc', 'apod-description'),
    readMore:    pick('readMore'),
    dateInput:   pick('apodDate', 'date-input'),
    loadBtn:     pick('loadBtn'),
    loading:     pick('loading'),
    errorBox:    pick('errorBox'),
    modal:       pick('modal'),
    modalTitle:  pick('modalTitle'),
    modalBody:   pick('modalBody'),
  };
}

function setLoading(els, isLoading) {
  if (!els.loading || !els.loadBtn) return;
  if (isLoading) {
    show(els.loading);
    els.loadBtn.setAttribute('disabled', 'true');
    els.loadBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    hide(els.loading);
    els.loadBtn.removeAttribute('disabled');
    els.loadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

function setError(els, message = '') {
  if (!els.errorBox) {
    console.warn('Missing #errorBox element'); 
    return;
  }
  if (!message) return hide(els.errorBox);
  els.errorBox.textContent = message;
  show(els.errorBox);
}

async function fetchApod(dateStr = '') {
  let url = APOD_URL_BASE;
  if (dateStr) url += `&date=${dateStr}`;

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  let data = {};
  try { data = JSON.parse(text); } catch { /* ignore non-JSON */ }

  if (!res.ok) {
    const msg = data?.error?.message || text || 'Unknown error';
    throw new Error(`HTTP ${res.status} – ${msg}`);
  }
  return data;
}

function renderApod(els, data) {
  if (!els.mediaWrap) { console.warn('Missing media wrapper'); return; }

  // Fill text fields if present
  if (els.title) els.title.textContent = data.title || 'Astronomy Picture of the Day';
  if (els.date)  els.date.textContent  = data.date  || '';
  if (els.desc)  els.desc.textContent  = data.explanation || '';

  // Ensure the media area is visible
  els.mediaWrap.classList.add('relative');
  if (!els.mediaWrap.classList.contains('aspect-video') && !els.mediaWrap.style.minHeight) {
    els.mediaWrap.style.minHeight = '16rem'; // ~h-64 fallback
  }

  // Media
  els.mediaWrap.innerHTML = '';
  if (data.media_type === 'image') {
    const img = document.createElement('img');
    img.src = data.url;
    img.alt = data.title || 'APOD image';
    img.className = 'absolute inset-0 w-full h-full object-cover';
    els.mediaWrap.appendChild(img);
  } else if (data.media_type === 'video') {
    const iframe = document.createElement('iframe');
    const embed = data.url.includes('watch?v=') ? data.url.replace('watch?v=', 'embed/') : data.url;
    iframe.src = embed;
    iframe.className = 'absolute inset-0 w-full h-full';
    iframe.setAttribute('allowfullscreen', 'true');
    els.mediaWrap.appendChild(iframe);
  } else {
    els.mediaWrap.textContent = 'Unsupported media type.';
  }

  // Modal trigger (if exists)
  if (els.readMore && els.desc) {
    els.readMore.onclick = () => openModal?.(data.title, data.explanation);
  }

  // Reveal card with a nice fade/translate if present
  if (els.card) {
    requestAnimationFrame(() => {
      els.card.classList.remove('opacity-0', 'translate-y-2');
    });
  }
}

function guardDateInput(els) {
  const today = new Date().toISOString().split('T')[0];
  if (els.dateInput) {
    els.dateInput.max = today;
    if (!els.dateInput.value) els.dateInput.value = today;
  }
}

async function initApod() {
  const els = getEls();
  setError(els, '');
  guardDateInput(els);
  setLoading(els, true);

  try {
    const data = await fetchApod(); // today
    renderApod(els, data);
  } catch (e) {
    console.error(e);
    setError(els, `Could not load APOD. ${e.message}`);
  } finally {
    setLoading(els, false);
  }

  // Optional: load specific date if you have controls
  els.loadBtn?.addEventListener('click', async () => {
    const dateStr = els.dateInput?.value;
    if (!dateStr) return;

    els.card?.classList.add('opacity-0', 'translate-y-2');
    setError(els, '');
    setLoading(els, true);

    try {
      const data = await fetchApod(dateStr);
      renderApod(els, data);
    } catch (e) {
      console.error(e);
      setError(els, `No APOD for that date or rate-limited. ${e.message}`);
    } finally {
      setLoading(els, false);
    }
  });
}

// Safe boot (works with Vite)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApod);
} else {
  initApod();
}
