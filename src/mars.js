// js/mars.js
// Load this file with: <script type="module" src="js/mars.js"></script>
import { $, show, hide, openModal } from './ui.js';

console.log('MARS: script booted');

/* ------------------------------ Config ------------------------------ */

// Use DEMO_KEY to verify flow; swap to your real key after.
// Get one at https://api.nasa.gov
const API_KEY = '2lWc2sGkMOhTHRThafaKdNcYGP9dHqgawJs6jG2Y';
const ROVER_BASE = 'https://api.nasa.gov/mars-photos/api/v1/rovers';

const CAMERA_OPTIONS = {
  curiosity: [
    { id: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
    { id: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
    { id: 'MAST', name: 'Mast Camera' },
    { id: 'CHEMCAM', name: 'Chemistry and Camera Complex' },
    { id: 'MAHLI', name: 'Mars Hand Lens Imager' },
    { id: 'MARDI', name: 'Mars Descent Imager' },
    { id: 'NAVCAM', name: 'Navigation Camera' },
  ],
  opportunity: [
    { id: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
    { id: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
    { id: 'NAVCAM', name: 'Navigation Camera' },
    { id: 'PANCAM', name: 'Panoramic Camera' },
    { id: 'MINITES', name: 'Mini-TES' },
  ],
  spirit: [
    { id: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
    { id: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
    { id: 'NAVCAM', name: 'Navigation Camera' },
    { id: 'PANCAM', name: 'Panoramic Camera' },
    { id: 'MINITES', name: 'Mini-TES' },
  ],
};

/* ---------------------------- UI helpers ---------------------------- */

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
    // Soft warn, but never break the app if #errorBox is missing
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

function defaultEarthDate() {
  // Curiosity landing anniversary often yields photos
  return '2016-08-06';
}

function populateCameras() {
  const roverSel = $('#roverSel');
  const camSel = $('#cameraSel');
  if (!roverSel || !camSel) return;

  const rover = roverSel.value || 'curiosity';
  camSel.innerHTML = '';
  (CAMERA_OPTIONS[rover] || []).forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.id} — ${c.name}`;
    if (i === 0) opt.selected = true;
    camSel.appendChild(opt);
  });
}

/* --------------------------- Data functions ------------------------- */

function buildMarsUrl(rover = 'curiosity', camera, earthDate) {
  const params = new URLSearchParams({ api_key: API_KEY });
  if (earthDate) params.set('earth_date', earthDate);
  if (camera) params.set('camera', camera);
  // /rovers/{rover}/photos
  return `${ROVER_BASE}/${rover}/photos?${params.toString()}`;
}

async function fetchPhotos(rover, camera, earthDate) {
  const url = buildMarsUrl(rover, camera, earthDate);
  const res = await fetch(url);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    throw new Error(`Mars photos request failed (${res.status}): ${text || 'Unknown error'}`);
  }
  const data = await res.json();
  return data.photos || [];
}

/* --------------------------- Render functions ----------------------- */

function renderGrid(photos) {
  const grid = $('#grid');
  const empty = $('#emptyState');
  if (!grid) {
    console.warn('Missing #grid container');
    return;
  }

  grid.innerHTML = '';

  if (!photos.length) {
    if (empty) show(empty);
    return;
  } else if (empty) {
    hide(empty);
  }

  photos.forEach((p) => {
    const card = document.createElement('article');
    card.className =
      'bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition';

    const img = document.createElement('img');
    img.src = p.img_src;
    img.alt = `${p.rover?.name || 'Rover'} — ${p.camera?.full_name || p.camera?.name || 'Camera'}`;
    img.loading = 'lazy';
    img.className = 'w-full h-48 object-cover bg-black';
    card.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'p-3 text-xs';
    meta.innerHTML = `
      <p class="text-gray-300">
        <span class="font-semibold">${p.rover?.name || ''}</span> • ${p.camera?.full_name || p.camera?.name || ''}
      </p>
      <p class="text-gray-400">Earth date: ${p.earth_date || ''}</p>
      <p class="text-gray-400">Sol: ${p.sol ?? ''}</p>
    `;
    card.appendChild(meta);

    card.addEventListener('click', () => {
      const modalImg = $('#modalImg');
      const modalTitle = $('#modalTitle');
      const modalMeta = $('#modalMeta');

      if (modalImg) {
        modalImg.src = p.img_src;
        modalImg.alt = img.alt;
      }
      if (modalTitle) {
        modalTitle.textContent = `${p.rover?.name || 'Rover'} — ${p.camera?.full_name || p.camera?.name || ''}`;
      }
      if (modalMeta) {
        modalMeta.textContent = `Earth date: ${p.earth_date || ''} • Sol: ${p.sol ?? ''} • Status: ${p.rover?.status || ''}`;
      }
      // Content already filled; this just toggles visibility in your UI lib
      openModal?.('', '');
    });

    grid.appendChild(card);
  });
}

/* ------------------------------ Loader ------------------------------ */

async function load() {
  setError('');
  setLoading(true);
  try {
    const rover = $('#roverSel')?.value || 'curiosity';
    const camera = $('#cameraSel')?.value || '';
    const earthDate = $('#earthDate')?.value || defaultEarthDate();

    const photos = await fetchPhotos(rover, camera, earthDate);
    renderGrid(photos);
  } catch (e) {
    console.error(e);

    // Friendlier error messages
    const msg = String(e);
    if (/API_KEY_INVALID/.test(msg) || /403/.test(msg)) {
      setError('Your NASA API key looks invalid or rate-limited. Try DEMO_KEY or replace with a valid key.');
    } else if (/Failed to fetch|NetworkError/i.test(msg)) {
      setError('Network error while fetching photos. Check your connection and try again.');
    } else {
      setError('Could not load photos (try another date or camera).');
    }

    const empty = $('#emptyState');
    if (empty) show(empty);
  } finally {
    setLoading(false);
  }
}

/* ------------------------------ Init ------------------------------- */

function initMars() {
  // Pre-fill date
  const dateInput = $('#earthDate');
  if (dateInput && !dateInput.value) dateInput.value = defaultEarthDate();

  // Populate cameras for selected rover (or default)
  populateCameras();

  // Wire up events
  $('#roverSel')?.addEventListener('change', populateCameras);
  $('#loadBtn')?.addEventListener('click', load);

  // Initial load
  load();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMars);
} else {
  initMars();
}
