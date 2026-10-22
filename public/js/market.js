// Click to copy, and the documentation menu on small screens.
document.addEventListener('click', (e) => {
  const copy = e.target.closest('[data-copy]');
  if (copy) {
    navigator.clipboard?.writeText(copy.dataset.copy).then(() => {
      const old = copy.textContent;
      copy.textContent = 'Copied';
      setTimeout(() => (copy.textContent = old), 1200);
    });
  }
  const toggle = e.target.closest('.navtoggle');
  if (toggle) {
    const nav = toggle.closest('.docnav');
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  }
});
