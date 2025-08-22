import { $, show, hide, openModal } from './ui.js';

const API_KEY = 'sKFtJEmy8JWNkrSD5jPeiiRldbcMzVzpwyyTuixc'; // replace later with your own key to avoid rate limits
const ENDPOINT = 'https://api.nasa.gov/planetary/apod';

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

// Build the request URL with optional date
function buildUrl(dateStr = '') {
  const url = new URL(ENDPOINT);
  url.searchParams.set('api_key', API_KEY);
  if (dateStr) url.searchParams.set('date', dateStr); // YYYY-MM-DD
  return url.toString();
}

// Fetch APOD data (async/await = pause until network reply arrives)
async function fetchApod(dateStr = '') {
  const res = await fetch(buildUrl(dateStr));
  if (!res.ok) {
    // Helpful message for beginners:
    // 400 often means invalid date; 429 means rate limit (DEMO_KEY hit)
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || 'Unknown error'}`);
  }
  return res.json();
}

// Put data into the page
function renderApod(data) {
  const card = $('#apodCard');
  const mediaWrap = $('#mediaWrap');

  // Basic fields
  $('#title').textContent = data.title || 'Astronomy Picture of the Day';
  $('#date').textContent = data.date || '';
  $('#desc').textContent = data.explanation || '';

  // Image vs video
  mediaWrap.innerHTML = ''; // clear previous content
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

  // Enable "Read more" modal
  $('#readMore').onclick = () => openModal(data.title, data.explanation);

  // Fade-in animation (remove the hidden classes AFTER data is ready)
  requestAnimationFrame(() => {
    card.classList.remove('opacity-0', 'translate-y-2');
  });
}

// Page entry point
async function init() {
  setError('');
  setLoading(true);
  try {
    // 1) Load today's APOD by default
    const data = await fetchApod();
    renderApod(data);
  } catch (err) {
    console.error(err);
    setError('Could not load APOD (try another date or use your own API key).');
  } finally {
    setLoading(false);
  }

  // 2) Wire up the date picker
  $('#loadBtn')?.addEventListener('click', async () => {
    const dateStr = $('#apodDate').value; // YYYY-MM-DD
    if (!dateStr) return;

    // reset animation and states
    $('#apodCard').classList.add('opacity-0', 'translate-y-2');
    setError('');
    setLoading(true);

    try {
      const data = await fetchApod(dateStr);
      renderApod(data);
    } catch (err) {
      console.error(err);
      setError('No APOD for that date, or the request was rate-limited.');
    } finally {
      setLoading(false);
    }
  });
}

init();
