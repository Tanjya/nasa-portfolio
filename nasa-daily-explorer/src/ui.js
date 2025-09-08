// src/ui.js

// Accept "id" with or without "#" (and ignore non-strings gracefully)
export const $ = (id) => {
  if (typeof id !== 'string') return null;
  return document.getElementById(id.startsWith('#') ? id.slice(1) : id);
};

export const show = (el) => el?.classList.remove('hidden');
export const hide = (el) => el?.classList.add('hidden');

// Modal: only overwrite content when args are actually provided
export function openModal(title, body) {
  const hasTitle = typeof title !== 'undefined' && title !== null;
  const hasBody = typeof body !== 'undefined' && body !== null;
  if (hasTitle && $('#modalTitle')) $('#modalTitle').textContent = title;
  if (hasBody && $('#modalBody'))  $('#modalBody').textContent  = body;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireGlobalUI);
} else {
  wireGlobalUI();
}
