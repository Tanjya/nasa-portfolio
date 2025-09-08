import { $, show, hide, openModal } from './ui.js';

console.log('SEARCH: script booted');

/* ------------------------------- Config ------------------------------ */
// NASA Image & Video Library (no key required)
const IMAGES_API = 'https://images-api.nasa.gov/search'; // ?q=&media_type=image&page=&year_start=&year_end=

/* ----------------------------- Utilities ---------------------------- */

function setLoading(isLoading) {
  const loading = $('#loading');
  const btn = $('#searchBtn');
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
  if (!message) hide(box);
  else {
    box.textContent = message;
    show(box);
  }
}

function buildUrl({ q, page = 1, yearStart, yearEnd }) {
  const params = new URLSearchParams({ media_type: 'image', page: String(page || 1) });
  const query = (q || '').trim();
  if (query) params.set('q', query);
  if (yearStart) params.set('year_start', String(yearStart));
  if (yearEnd) params.set('year_end', String(yearEnd));
  return `${IMAGES_API}?${params.toString()}`;
}

async function fetchImages(opts) {
  const url = buildUrl(opts);
  const res = await fetch(url);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    throw new Error(`Images API request failed (${res.status}): ${text || 'Unknown error'}`);
  }
  const data = await res.json();
  const collection = data.collection || {};
  const items = Array.isArray(collection.items) ? collection.items : [];

  // Basic pagination metadata
  const meta = {
    page: Number(new URL(url).searchParams.get('page')) || 1,
    total_hits: Number(collection.metadata?.total_hits) || 0,
    // NASA Images API doesn't give a hard total pages; estimate with 100 items/page typical
    estimated_pages: Math.max(1, Math.ceil((Number(collection.metadata?.total_hits) || 0) / 100)),
  };

  // Normalize item fields we care about
  const results = items.map((it) => {
    const data0 = (it.data && it.data[0]) || {};
    const link0 = (it.links && it.links[0]) || {};
    return {
      nid: data0.nasa_id,
      title: data0.title || 'Untitled',
      desc: data0.description || '',
      date_created: data0.date_created || '',
      center: data0.center || '',
      photographer: data0.photographer || data0.secondary_creator || '',
      keywords: data0.keywords || [],
      thumb: link0.href || '', // preview-sized image
      // For originals you'd call the asset endpoint; for speed we stick to preview here
    };
  });

  return { results, meta };
}

/* ------------------------------- Render ----------------------------- */

function renderGrid(data, meta) {
  const grid = $('#grid');
  const empty = $('#emptyState');
  const pager = $('#pager');
  const pageNow = $('#pageNow');
  const pageTotalWrap = $('#pageTotalWrap');
  const pageTotal = $('#pageTotal');

  if (!grid) return;

  grid.innerHTML = '';

  if (!data.length) {
    if (empty) show(empty);
    if (pager) hide(pager);
    return;
  } else {
    if (empty) hide(empty);
  }

  data.forEach((r) => {
    const card = document.createElement('article');
    card.className = 'bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition';

    const img = document.createElement('img');
    img.src = r.thumb || '';
    img.alt = r.title || 'NASA image';
    img.loading = 'lazy';
    img.className = 'w-full h-48 object-cover bg-black';
    card.appendChild(img);

    const metaBox = document.createElement('div');
    metaBox.className = 'p-3 text-xs';
    metaBox.innerHTML = `
      <p class="text-gray-200 font-semibold text-sm mb-1 line-clamp-1">${r.title}</p>
      <p class="text-gray-400 line-clamp-2">${r.center || ''} ${r.photographer ? '• ' + r.photographer : ''}</p>
      <p class="text-gray-500">${r.date_created ? new Date(r.date_created).toLocaleDateString() : ''}</p>
    `;
    card.appendChild(metaBox);

    card.addEventListener('click', () => {
      const modalImg = $('#modalImg');
      const modalTitle = $('#modalTitle');
      const modalMeta = $('#modalMeta');
      const modalBody = $('#modalBody');

      if (modalImg) {
        modalImg.src = r.thumb || '';
        modalImg.alt = r.title || 'NASA image';
      }
      if (modalTitle) modalTitle.textContent = r.title || 'NASA Image';
      if (modalMeta) {
        const date = r.date_created ? new Date(r.date_created).toLocaleString() : '';
        const byline = [r.center, r.photographer].filter(Boolean).join(' • ');
        modalMeta.textContent = [date, byline].filter(Boolean).join(' — ');
      }
      if (modalBody) modalBody.textContent = r.desc || '';
      openModal();
    });

    grid.appendChild(card);
  });

  // Pagination controls
  if (pager && pageNow) {
    show(pager);
    pageNow.textContent = String(meta.page || 1);
    if (pageTotal && pageTotalWrap) {
      pageTotal.textContent = String(meta.estimated_pages || 1);
      // Hide total if total_hits is small / not informative
      if ((meta.total_hits || 0) > 100) show(pageTotalWrap);
      else hide(pageTotalWrap);
    }
  }
}

/* ------------------------------- Events ----------------------------- */

let state = {
  q: '',
  yearStart: '',
  yearEnd: '',
  page: 1,
};

async function doSearch() {
  setError('');
  setLoading(true);
  try {
    const { results, meta } = await fetchImages(state);
    renderGrid(results, meta);

    // Wire pager enabled/disabled
    const prevBtn = $('#prevBtn');
    const nextBtn = $('#nextBtn');
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) {
      // If we got fewer than 100 items, assume last page; otherwise keep next enabled
      nextBtn.disabled = results.length < 100;
    }
  } catch (e) {
    console.error(e);
    const msg = String(e);
    if (/Failed to fetch|NetworkError/i.test(msg)) {
      setError('Network error while searching. Check your connection and try again.');
    } else {
      setError(msg || 'Could not load results.');
    }
    const empty = $('#emptyState');
    if (empty) show(empty);
  } finally {
    setLoading(false);
  }
}

function readControlsToState() {
  state.q = $('#q')?.value?.trim() || '';
  state.yearStart = $('#yearStart')?.value || '';
  state.yearEnd = $('#yearEnd')?.value || '';
}

function initSearch() {
  // Sensible default query so page isn’t blank
  if ($('#q') && !$('#q').value) $('#q').value = 'Mars rover';

  $('#searchBtn')?.addEventListener('click', () => {
    state.page = 1;
    readControlsToState();
    doSearch();
  });

  $('#prevBtn')?.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      doSearch();
    }
  });
  $('#nextBtn')?.addEventListener('click', () => {
    state.page += 1;
    doSearch();
  });

  // Enter key triggers search
  $('#q')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      state.page = 1;
      readControlsToState();
      doSearch();
    }
  });

  // Initial run
  readControlsToState();
  doSearch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}
