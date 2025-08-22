// Simple DOM helpers
export const $ = (id) => document.getElementById(id);
export const show = (el) => el.classList.remove('hidden');
export const hide = (el) => el.classList.add('hidden');

// Modal controls
export function openModal(title, body) {
  $('#modalTitle').textContent = title || '';
  $('#modalBody').textContent = body || '';
  show($('#modal'));
}
export function closeModal() {
  hide($('#modal'));
}

// Init modal close handlers once
(function initModalClose() {
  $('#modalClose')?.addEventListener('click', closeModal);
  $('#modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal(); // click outside content to close
  });
})();

// Theme toggle (just flips a class on <html>)
(function initThemeToggle() {
  $('#themeToggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
})();
