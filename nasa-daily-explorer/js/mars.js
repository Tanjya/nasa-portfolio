import { $, show, hide, openModal } from './ui.js';

const API_KEY = 'sKFtJEmy8JWNkrSD5jPeiiRldbcMzVzpwyyTuixc'; 
const BASE = 'https://api.nasa.gov/mars-photos/api/v1';

// Available cameras by rover (NASA docs)
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
  if (!message) return hide(box);
  box.textContent = message;
  show(box);
}

// Fill the camera <select> based on current rover
function populateCameras() {
  const rover = $('#roverSel').value;
  const camSel = $('#cameraSel');
  camSel.innerHTML = '';
  CAMERA_OPTIONS[rover].forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.id} — ${c.name}`;
    if (i === 0) opt.selected = true;
    camSel.appendChild(opt);
  });
}

// Build URL: /rovers/{rover}/photos?earth_date=YYYY-MM-DD&camera={CAM}&api_key=KEY
function buildUrl({ rover, camera, earthDate }) {
  const url = new URL(`${BASE}/rovers/${rover}/photos`);
  url.searchParams.set('earth_date', earthDate);
  if (camera) url.searchParams.set('camera', camera);
  url.searchParams.set('api_key', API_KEY);
  return url.toString();
}

// Fetch photos
async function fetchPhotos(params) {
  const res = await fetch(buildUrl(params));
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || 'Unknown error'}`);
  }
  const data = await res.json();
  return data.photos || [];
}

// Render the grid
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
    // Card
    const card = document.createElement('article');
    card.className = 'bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition';

    // Image
    const img = document.createElement('img');
    img.src = p.img_src;
    img.alt = `${p.rover?.name || 'Rover'} — ${p.camera?.full_name || p.camera?.name || 'Camera'}`;
    img.loading = 'lazy';
    img.className = 'w-full h-48 object-cover bg-black';
    card.appendChild(img);

    // Meta
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

    // Click → open modal with larger image + details
    card.addEventListener('click', () => {
      // We’ll reuse the modal shell but fill custom content
      $('#modalImg').src = p.img_src;
      $('#modalImg').alt = img.alt;
      $('#modalTitle').textContent = `${p.rover?.name || 'Rover'} — ${p.camera?.full_name || p.camera?.name || ''}`;
      $('#modalMeta').textContent = `Earth date: ${p.earth_date || ''} • Sol: ${p.sol ?? ''} • Status: ${p.rover?.status || ''}`;
      // openModal sets title/body; we already filled custom fields, so pass empty strings
      openModal('', '');
    });

    grid.appendChild(card);
  });
}

// Choose a sensible default date:
// Curiosity is active; picking a very recent date may still yield 0 photos.
// We'll default to 2016-08-06 (Curiosity anniversary) as a safe example,
// but you can try today for fun.
function defaultEarthDate() {
  return '2016-08-06';
}

async function load() {
  setError('');
  setLoading(true);
  try {
    const params = {
      rover: $('#roverSel').value,
      camera: $('#cameraSel').value,
      earthDate: $('#earthDate').value || defaultEarthDate(),
    };
    const photos = await fetchPhotos(params);
    renderGrid(photos);
  } catch (e) {
    console.error(e);
    setError('Could not load photos (try another date or use your own API key).');
    show($('#emptyState'));
  } finally {
    setLoading(false);
  }
}

function initInputs() {
  // Initial cameras based on default rover
  populateCameras();

  // When rover changes, refresh camera options
  $('#roverSel').addEventListener('change', () => {
    populateCameras();
  });

  // Set a default date so beginners see results immediately
  $('#earthDate').value = defaultEarthDate();

  // Load on button click
  $('#loadBtn').addEventListener('click', load);
}

function init() {
  initInputs();
  // Initial fetch on page load
  load();
}

init();
