// js/apod.js
import { $, show, hide, openModal } from './ui.js';

const API_KEY = 'sKFtJEmy8JWNkrSD5jPeiiRldbcMzVzpwyyTuixc'; // Your NASA API Key
const APOD_URL_BASE = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

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

// Fetch APOD (optionally by date YYYY-MM-DD)
async function fetchApod(dateStr = '') {
  let url = APOD_URL_BASE;
  if (dateStr) url += `&date=${dateStr}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`APOD request failed (${res.status}): ${text || 'Unknown error'}`);
  }
  return res.json();
}

function renderApod(data) {
  const card = $('#apodCard');
  const mediaWrap = $('#mediaWrap');

  $('#title').textContent = data.title || 'Astronomy Picture of the Day';
  $('#date').textContent = data.date || '';
  $('#desc').textContent = data.explanation || '';

  // Render image or video
  mediaWrap.innerHTML = '';
  if (data.media_type === 'image') {
    const img = document.createElement('img');
    img.src = data.url;
    img.alt = data.title || 'APOD image';
    img.className = 'w-full h-full object-cover';
    mediaWrap.appendChild(img);
  } else if (data.media_type === 'video') {
    const iframe = document.createElement('iframe');
    iframe.src = data.url;
    iframe.className = 'w-full h-full';
    iframe.setAttribute('allowfullscreen', 'true');
    mediaWrap.appendChild(iframe);
  } else {
    mediaWrap.textContent = 'Unsupported media type.';
  }

  // Read more → modal
  $('#readMore').onclick = () => openModal(data.title, data.explanation);

  // Fade in after data is ready
  requestAnimationFrame(() => {
    card.classList.remove('opacity-0', 'translate-y-2');
  });
}

async function init() {
  setError('');
  setLoading(true);
  try {
    const data = await fetchApod(); // default: today
    renderApod(data);
  } catch (e) {
    console.error(e);
    setError('Could not load APOD (try another date or use your own API key).');
  } finally {
    setLoading(false);
  }

  // Load by selected date
  $('#loadBtn')?.addEventListener('click', async () => {
    const dateStr = $('#apodDate').value; // YYYY-MM-DD
    if (!dateStr) return;

    $('#apodCard').classList.add('opacity-0', 'translate-y-2'); // reset animation
    setError('');
    setLoading(true);

    try {
      const data = await fetchApod(dateStr);
      renderApod(data);
    } catch (e) {
      console.error(e);
      setError('No APOD for that date, or the request was rate-limited.');
    } finally {
      setLoading(false);
    }
  });
}

init();
