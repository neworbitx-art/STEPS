const motionButton = document.querySelector('.motion-toggle');
motionButton.addEventListener('click', () => {
  const paused = motionButton.closest('.hero').classList.toggle('motion-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = paused ? 'Reanudar movimiento' : 'Pausar movimiento';
});
