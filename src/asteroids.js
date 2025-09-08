import { $, show, hide, openModal } from './ui.js';

console.log('ASTEROIDS: script booted');

/* ------------------------------ Config ------------------------------ */

const API_KEY = '2lWc2sGkMOhTHRThafaKdNcYGP9dHqgawJs6jG2Y';
const NEO_FEED = 'https://api.nasa.gov/neo/rest/v1/feed'; // ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&api_key=...

/* ---------------------------- Utilities ---------------------------- */

const fmt = (n, d = 0) =>
  typeof n === 'number' && Number.isFinite(n) ? n.toFixed(d) : String(n ?? '');

function yyyyMmDd(date) {
  // date: Date or ISO string; returns YYYY-MM-DD
  const d = date instanceof Date ? date : new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysAfter(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/* -------------------------- UI state helpers ----------------------- */

function setLoading(isLoading) {
  const loading = $('#loading');
  const btn = $('#loadBtn');
  if (loading) (isLoading ? show(loading) : hide(loading));
  if (btn) {
    if (isLoading) {
      btn.setAttribute('disabled', 'true');
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

function setError(message = '') {
  const box = $('#errorBox');
  if (!box) {
    if (message) console.warn('Missing #errorBox. Error:', message);
    return;
  }
  if (!message) {
    hide(box);
  } else {
    box.textContent = message;
    show(box);
  }
}

/* ------------------------------ Data ------------------------------- */

function buildFeedUrl(startDate, endDate) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    start_date: startDate,
    end_date: endDate,
  });
  return `${NEO_FEED}?${params.toString()}`;
}

async function fetchNEOFeed(startDate, endDate) {
  const url = buildFeedUrl(startDate, endDate);
  const res = await fetch(url);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    throw new Error(`NEO feed request failed (${res.status}): ${text || 'Unknown error'}`);
  }
  const data = await res.json();

  // Flatten object keyed by date → array with date preserved
  const out = [];
  const map = data.near_earth_objects || {};
  Object.keys(map).forEach((date) => {
    (map[date] || []).forEach((neo) => {
      out.push({ date, ...neo });
    });
  });
  return out;
}

/* ------------------------------ Render ----------------------------- */

function km(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return String(num ?? '');
  if (n >= 1000000) return `${fmt(n / 1_000_000, 2)}M km`;
  if (n >= 1000) return `${fmt(n / 1000, 2)}k km`;
  return `${fmt(n, 0)} km`;
}

function renderGrid(neos) {
  const grid = $('#grid');
  const empty = $('#emptyState');
  if (!grid) {
    console.warn('Missing grid container');
    return;
  }
  grid.innerHTML = '';

  if (!neos.length) {
    if (empty) show(empty);
    return;
  } else if (empty) {
    hide(empty);
  }

  const hazOnly = $('#hazOnly')?.checked;
  const sortByClose = $('#sortByClose')?.checked;

  let items = neos.slice();
  if (hazOnly) items = items.filter((n) => n.is_potentially_hazardous_asteroid);

  // choose first close_approach_data item, usually index 0
  const getCAD = (n) => (n.close_approach_data && n.close_approach_data[0]) || {};

  if (sortByClose) {
    items.sort((a, b) => {
      const da = Number(getCAD(a).miss_distance?.kilometers) || Number.POSITIVE_INFINITY;
      const db = Number(getCAD(b).miss_distance?.kilometers) || Number.POSITIVE_INFINITY;
      return da - db;
    });
  } else {
    // default sort by date then absolute magnitude (brighter first)
    items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.absolute_magnitude_h ?? 999) - (b.absolute_magnitude_h ?? 999);
    });
  }

  items.forEach((n) => {
    const cad = getCAD(n);
    const est = n.estimated_diameter?.meters || {};
    const dMin = est.estimated_diameter_min;
    const dMax = est.estimated_diameter_max;

    const card = document.createElement('article');
    card.className =
      'bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition p-3';

    // Header line
    const name = document.createElement('h3');
    name.className = 'font-semibold text-sm mb-1';
    name.textContent = n.name || n.designation || 'NEO';
    card.appendChild(name);

    // Badges
    const badges = document.createElement('div');
    badges.className = 'flex flex-wrap gap-2 mb-2 text-[11px]';
    const haz = document.createElement('span');
    haz.className = `px-2 py-0.5 rounded-full border ${
      n.is_potentially_hazardous_asteroid ? 'border-red-400 text-red-300' : 'border-green-400 text-green-300'
    }`;
    haz.textContent = n.is_potentially_hazardous_asteroid ? 'Potentially hazardous' : 'Not hazardous';
    badges.appendChild(haz);

    const dateChip = document.createElement('span');
    dateChip.className = 'px-2 py-0.5 rounded-full border border-white/20 text-gray-300';
    dateChip.textContent = n.date;
    badges.appendChild(dateChip);

    card.appendChild(badges);

    // Meta grid
    const meta = document.createElement('div');
    meta.className = 'grid grid-cols-2 gap-2 text-xs text-gray-300';
    meta.innerHTML = `
      <div><span class="text-gray-400">Abs. mag:</span> ${fmt(n.absolute_magnitude_h, 1)}</div>
      <div><span class="text-gray-400">Est. dia:</span> ${fmt(dMin, 0)}–${fmt(dMax, 0)} m</div>
      <div><span class="text-gray-400">Close date:</span> ${cad.close_approach_date_full || cad.close_approach_date || '—'}</div>
      <div><span class="text-gray-400">Miss dist:</span> ${km(cad.miss_distance?.kilometers)}</div>
      <div><span class="text-gray-400">Rel. vel:</span> ${fmt(Number(cad.relative_velocity?.kilometers_per_hour), 0)} km/h</div>
      <div><span class="text-gray-400">Orbiting body:</span> ${cad.orbiting_body || '—'}</div>
    `;
    card.appendChild(meta);

    card.addEventListener('click', () => {
      const modalTitle = $('#modalTitle');
      const modalMeta = $('#modalMeta');
      const modalBody = $('#modalBody');

      if (modalTitle) {
        modalTitle.textContent = `${n.name || n.designation || 'NEO'} • ${n.nasa_jpl_url ? 'Details' : ''}`;
      }
      if (modalMeta) {
        modalMeta.textContent = `ID: ${n.id} • Absolute magnitude: ${fmt(n.absolute_magnitude_h, 1)}`;
      }
      if (modalBody) {
        const closeDate = cad.close_approach_date_full || cad.close_approach_date || '—';
        modalBody.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <div><span class="text-gray-400">Potentially hazardous:</span> ${n.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</div>
              <div><span class="text-gray-400">Estimated diameter (m):</span> ${fmt(dMin, 1)} – ${fmt(dMax, 1)}</div>
              <div><span class="text-gray-400">Sentry object:</span> ${n.is_sentry_object ? 'Yes' : 'No'}</div>
            </div>
            <div class="space-y-1">
              <div><span class="text-gray-400">Closest approach:</span> ${closeDate}</div>
              <div><span class="text-gray-400">Miss distance:</span> ${km(cad.miss_distance?.kilometers)}</div>
              <div><span class="text-gray-400">Relative velocity:</span> ${fmt(Number(cad.relative_velocity?.kilometers_per_hour), 0)} km/h</div>
            </div>
          </div>
          ${n.nasa_jpl_url ? `<p class="mt-3 text-xs"><a class="underline" href="${n.nasa_jpl_url}" target="_blank" rel="noreferrer">Open JPL Small-Body DB ↗</a></p>` : ''}
        `;
      }
      openModal(); // just open; we already set content
    });

    grid.appendChild(card);
  });
}

/* ------------------------------ Loader ------------------------------ */

async function load() {
  setError('');
  setLoading(true);
  try {
    const start = $('#startDate')?.value;
    const end = $('#endDate')?.value;

    if (!start || !end) {
      throw new Error('Please select a start and end date.');
    }

    // Enforce <= 7 days range per API
    const startD = new Date(start);
    const endD = new Date(end);
    const diff = (endD - startD) / (1000 * 60 * 60 * 24);
    if (diff < 0) throw new Error('End date must be after start date.');
    if (diff > 7) throw new Error('The range cannot exceed 7 days.');

    const neos = await fetchNEOFeed(start, end);
    renderGrid(neos);
  } catch (e) {
    console.error(e);
    const msg = String(e);
    if (/403/.test(msg)) {
      setError('Your NASA API key looks invalid or rate-limited. Try again with a valid key.');
    } else if (/Failed to fetch|NetworkError/i.test(msg)) {
      setError('Network error while fetching NEOs. Check your connection and try again.');
    } else {
      setError(msg || 'Could not load NEOs.');
    }
    const empty = $('#emptyState');
    if (empty) show(empty);
  } finally {
    setLoading(false);
  }
}

/* ------------------------------ Init ------------------------------- */

function defaultRange() {
  // Default: last 3 days to today (safe within 7 days)
  const today = new Date();
  const start = daysAfter(today, -3);
  return { start: yyyyMmDd(start), end: yyyyMmDd(today) };
}

function initAsteroids() {
  // Prefill dates
  const rng = defaultRange();
  const s = $('#startDate');
  const e = $('#endDate');
  if (s && !s.value) s.value = rng.start;
  if (e && !e.value) e.value = rng.end;

  // Wire buttons/filters
  $('#loadBtn')?.addEventListener('click', load);
  $('#hazOnly')?.addEventListener('change', () => load());      // re-filter by refetching (simple)
  $('#sortByClose')?.addEventListener('change', () => load());   // resort after refetch

  // Initial load
  load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAsteroids);
} else {
  initAsteroids();
}
