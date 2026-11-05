// Tracks whether the user is driving the UI with keys (remote / D-pad) or the
// mouse, as <html data-input="keyboard|mouse">. In keyboard mode the global
// styles disable pointer events, so a resting cursor can't hover cards.

// Ignore jitter and the synthetic moves browsers fire after scroll or layout.
const MIN_MOVE = 4;

const setMode = (mode: 'keyboard' | 'mouse') => {
    if (document.documentElement.dataset.input !== mode) {
        document.documentElement.dataset.input = mode;
    }
};

const initInputMode = () => {
    setMode('mouse');
    window.addEventListener('keydown', () => setMode('keyboard'), true);
    let lastX: number | null = null;
    let lastY: number | null = null;
    window.addEventListener('mousemove', (event) => {
        const moved = lastX !== null && lastY !== null &&
            Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY) >= MIN_MOVE;
        lastX = event.clientX;
        lastY = event.clientY;
        if (moved) setMode('mouse');
    }, true);
    window.addEventListener('mousedown', () => setMode('mouse'), true);
};

export default initInputMode;
