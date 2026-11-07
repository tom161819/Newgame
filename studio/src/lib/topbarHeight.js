// Keeps --topbar-h equal to the sticky top bar's height (it wraps on narrow windows), so side lists can fill the rest
// of the window and scroll on their own.
export function trackTopbarHeight(bar = document.querySelector('.topbar')) {
  if (!bar) return;
  const set = () => document.documentElement.style.setProperty('--topbar-h', `${Math.ceil(bar.getBoundingClientRect().height)}px`);
  set();
  if (typeof ResizeObserver === 'function') new ResizeObserver(set).observe(bar);
  else window.addEventListener('resize', set);
}
