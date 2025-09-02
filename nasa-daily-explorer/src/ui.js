// js/ui.js
export const $ = (id) => document.getElementById(id);
export const show = (el) => el?.classList.remove('hidden');
export const hide = (el) => el?.classList.add('hidden');

// Modal (content is filled by each page)
export function openModal(title, body) {
  if ($('#modalTitle')) $('#modalTitle').textContent = title || '';
  if ($('#modalBody'))  $('#modalBody').textContent  = body  || '';
  show($('#modal'));
}
export function closeModal() {
  hide($('#modal'));
}

// Wire modal + theme once DOM is ready
function wireGlobalUI() {
  $('#modalClose')?.addEventListener('click', closeModal);
  $('#modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal(); // click backdrop to close
  });
  $('#themeToggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
}

// Ensure it runs whether scripts load before/after DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireGlobalUI);
} else {
  wireGlobalUI();
}
