const BACK_KEYS = ['Escape', 'Backspace', 'BrowserBack'];

const isHome = () => {
    const path = window.location.hash.replace(/^#/, '').split('?')[0];
    return path === '' || path === '/';
};

// Last resort: a Back nobody handled goes to Home, so the remote never gets
// stuck on a page. Checked after the event is done, so every other handler
// (dialogs, pages, the rail) gets it first.
const onKeyDown = (event: KeyboardEvent) => {
    if (!BACK_KEYS.includes(event.key) || event.repeat) return;
    // Backspace edits text fields
    if (event.target instanceof HTMLElement && event.target.matches('input, textarea, [data-text-entry]')) return;
    setTimeout(() => {
        if (event.defaultPrevented || isHome()) return;
        if (document.querySelector('.modals-container > .modal-container')) return;
        window.location.hash = '#/';
    });
};

const initBackFallback = () => {
    window.addEventListener('keydown', onKeyDown);
};

export default initBackFallback;
