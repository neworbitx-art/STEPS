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

const depthScenes = [...document.querySelectorAll('.scene')];
const reduceSceneMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let depthFrame = 0;

function updateSceneDepth() {
  depthFrame = 0;
  if (reduceSceneMotion.matches) return;
  const viewport = window.innerHeight;
  const offsets = depthScenes.map(scene => {
    const { top, height } = scene.getBoundingClientRect();
    if (top >= viewport || top + height <= 0) return null;
    const progress = (top + height / 2 - viewport / 2) / ((height + viewport) / 2);
    return -progress * 5.5;
  });
  depthScenes.forEach((scene, index) => {
    if (offsets[index] !== null) scene.style.setProperty('--scene-depth', offsets[index] + '%');
  });
}

function requestSceneDepth() {
  if (!depthFrame && !reduceSceneMotion.matches) depthFrame = requestAnimationFrame(updateSceneDepth);
}

window.addEventListener('scroll', requestSceneDepth, { passive: true });
window.addEventListener('resize', requestSceneDepth);
window.addEventListener('pageshow', requestSceneDepth);
reduceSceneMotion.addEventListener('change', requestSceneDepth);
requestSceneDepth();
