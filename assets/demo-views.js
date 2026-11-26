const demoViewLinks = document.querySelector('.demo-views');
const demoViewContent = document.querySelector('.demo-view-content');
const reduceDemoMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let leavingDemoView = false;

demoViewLinks.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || link.hasAttribute('aria-current') || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      reduceDemoMotion.matches || !demoViewContent.animate) return;

  event.preventDefault();
  if (leavingDemoView) return;
  leavingDemoView = true;
  const fade = demoViewContent.animate([{ opacity: 1 }, { opacity: .15 }], {
    duration: 120,
    easing: 'ease-in',
  });
  const navigate = () => window.location.assign(link.href);
  fade.finished.then(navigate, navigate);
});

window.addEventListener('pageshow', () => {
  leavingDemoView = false;
});
