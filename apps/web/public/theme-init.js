// EduFlow theme pre-paint — runs synchronously in <head> so the correct theme
// is applied before first paint (no flash of the wrong theme). Kept external so
// a Content-Security-Policy with `script-src 'self'` can be enforced.
(function () {
  try {
    var stored = localStorage.getItem('eduflow-theme');
    if (stored === 'glass') stored = 'lucid';
    if (stored === 'light' || stored === 'dark' || stored === 'lucid') {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
  } catch (e) {
    /* localStorage unavailable — default theme applies */
  }
})();
