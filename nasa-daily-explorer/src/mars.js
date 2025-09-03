// js/mars.js
import { $, show, hide, openModal } from './ui.js';
console.log('MARS: script booted');

const API_KEY = 'sKFtJEmy8JWNkrSD5jPeiiRldbcMzVzpwyyTuixc';
const ROVER_BASE_URL = 'https://api.nasa.gov/mars-photos/api/v1/rovers';

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
    { id: 'MINITES', name: 'Miniature Thermal Emission Spectrometer (Mini-TES)' },
  ],
  spirit: [
    { id: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
    { id: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
    { id: 'NAVCAM', name: 'Navigation Camera' },
    { id: 'PANCAM', name: 'Panoramic Camera' },
    { id: 'MINITES', name: 'Miniature Thermal Emission Spectrometer (Mini-TES)' },
  ],
};

function setLoading(isLoading) {
  const loading = $('#loading');
  const btn = $('#loadBtn');
  if (isLoading) {
    show(loading);
    btn?.setAttribute('disabled', 'true');
    btn?.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    hide(loading);
    btn?.removeAttribute('disabled');
    btn?.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

function setError(message = '') {
  const box = $('#errorBox');
  if (!box) { console.warn('Missing #errorBox. Error:', message); return; }
  if (!message) { hide(box); return; }
  box.textContent = message;
  show(box);
}

function populateCameras() {
  const roverSel = $('#roverSel');
  const camSel = $('#cameraSel');
  if (!roverSel || !camSel) return;

  const rover = roverSel.value;
  camSel.innerHTML = '';
  (CAMERA_OPTIONS[rover] || []).forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.id} — ${c.name}`;
    if (i === 0) opt.selected = true;
    camSel.appendChild(opt);
  });
}

function buildMarsUrl(rover, camera, earthDate) {
  let url = `${ROVER_BASE_URL}/${rover}/photos?earth_date=${earthDate}&api_key=${API_KEY}`;
  if (camera) url += `&camera=${camera}`;
  return url;
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

function renderGrid(photos) {
  const grid = $('#grid');
  grid.innerHTML = '';

  if (!photos.length) {
    show($('#emptyState'));
    return;
  } else {
    hide($('#emptyState'));
  }

  photos.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition';

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
      $('#modalImg').src = p.img_src;
      $('#modalImg').alt = img.alt;
      $('#modalTitle').textContent = `${p.rover?.name || 'Rover'} — ${p.camera?.full_name || p.camera?.name || ''}`;
      $('#modalMeta').textContent = `Earth date: ${p.earth_date || ''} • Sol: ${p.sol ?? ''} • Status: ${p.rover?.status || ''}`;
      openModal('', ''); // show modal (content already filled)
    });

    grid.appendChild(card);
  });
}

function defaultEarthDate() {
  return '2016-08-06'; // Curiosity landing anniversary (usually returns photos)
}

async function load() {
  setError('');
  setLoading(true);
  try {
    const rover = $('#roverSel')?.value;
    const camera = $('#cameraSel')?.value;
    const earthDate = $('#earthDate')?.value || defaultEarthDate();
    const photos = await fetchPhotos(rover, camera, earthDate);
    renderGrid(photos);
  } catch (e) {
    console.error(e);
    setError('Could not load photos (try another date or use your own API key).');
    show($('#emptyState'));
  } finally {
    setLoading(false);
  }
}

function initMars() {
  populateCameras();
  const dateInput = $('#earthDate');
  if (dateInput) dateInput.value = defaultEarthDate();
  $('#roverSel')?.addEventListener('change', populateCameras);
  $('#loadBtn')?.addEventListener('click', load);
  load(); // initial load
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMars);
} else {
  initMars();
}
