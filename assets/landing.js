const track = document.querySelector('.step-track');
const tabs = [...track.querySelectorAll('button')];
const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));

function activateStep(index) {
  tabs.forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[position].hidden = !selected;
  });
}

track.setAttribute('role', 'tablist');
tabs.forEach((tab, index) => {
  tab.setAttribute('role', 'tab');
  panels[index].setAttribute('role', 'tabpanel');
  panels[index].setAttribute('aria-labelledby', tab.id);
  panels[index].tabIndex = 0;
  tab.addEventListener('click', () => activateStep(index));
  tab.addEventListener('keydown', event => {
    const destinations = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = destinations[event.key];
    if (next === undefined) return;
    event.preventDefault();
    activateStep(next);
    tabs[next].focus();
  });
});
activateStep(0);
track.hidden = false;

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const clinic = document.querySelector('.clinic-scene');
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    clinic.classList.add('scene-entered');
    observer.disconnect();
  }, { threshold: .24 });
  observer.observe(clinic);
}
