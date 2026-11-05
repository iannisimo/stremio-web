import initInputMode from './inputMode';

// A screen can claim keys before anything else sees them (the player does,
// for its hidden-controls mode). Return true when the key was handled.
type KeyInterceptor = (event: KeyboardEvent) => boolean;
// an array: the build targets ES5, where for-of over a Set runs zero times
let interceptors: KeyInterceptor[] = [];

export const addKeyInterceptor = (interceptor: KeyInterceptor) => {
    interceptors = [...interceptors, interceptor];
    return () => {
        interceptors = interceptors.filter((other) => other !== interceptor);
    };
};

const onKeyDownCapture = (event: KeyboardEvent) => {
    for (const interceptor of interceptors) {
        if (interceptor(event)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
    }
};

// Remote keys: Select (XF86Select) works like Enter, short press and hold.
// Menu (XF86MenuKB / ContextMenu) opens the focused item's actions, the same
// handler a right click or a long Enter press uses.
const isSelect = (event: KeyboardEvent) => event.key === 'Select' || event.keyCode === 41;
const isMenu = (event: KeyboardEvent) => event.key === 'ContextMenu' || event.keyCode === 93;

const focusedElement = () => (document.activeElement instanceof HTMLElement ? document.activeElement : document.body);

const onRemoteKeyCapture = (event: KeyboardEvent) => {
    if (!event.isTrusted) return;
    if (isSelect(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const target = focusedElement();
        const enter = new KeyboardEvent(event.type, { key: 'Enter', code: 'Enter', repeat: event.repeat, bubbles: true, cancelable: true });
        const handled = !target.dispatchEvent(enter);
        // native links and buttons only activate on a real Enter
        if (event.type === 'keydown' && !handled && !event.repeat && target.matches('a[href], button')) {
            target.click();
        }
    } else if (isMenu(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.type !== 'keydown' || event.repeat) return;
        const target = focusedElement();
        const rect = target.getBoundingClientRect();
        target.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
        }));
    }
};

const initInput = () => {
    // first, so keys swallowed below still switch the input mode
    initInputMode();
    window.addEventListener('keydown', onRemoteKeyCapture, true);
    window.addEventListener('keyup', onRemoteKeyCapture, true);
    window.addEventListener('keydown', onKeyDownCapture, true);
};

export default initInput;
