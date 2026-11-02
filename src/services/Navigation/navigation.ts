import {
    init,
    setKeyMap,
    setFocus,
    getCurrentFocusKey,
    doesFocusableExist,
    ROOT_FOCUS_KEY,
    SpatialNavigation,
} from '@noriginmedia/norigin-spatial-navigation';
import initInputMode from './inputMode';

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

// A screen can claim keys before the navigation sees them (the player does,
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

type Entry = { focusKey: string, parentFocusKey: string, node: Element | null, focusable: boolean };
type Registry = Record<string, Entry>;
const registry = () => (SpatialNavigation as unknown as { focusableComponents: Registry }).focusableComponents;

// The engine's current key must still exist and own the DOM focus; a click on
// a plain element or a blur leaves a stale key behind.
const hasFocus = () => {
    const key = getCurrentFocusKey();
    if (typeof key !== 'string' || key === ROOT_FOCUS_KEY || !doesFocusableExist(key)) return false;
    const node = registry()[key]?.node;
    return !!node && (node === document.activeElement || node.contains(document.activeElement));
};

export const SIDEBAR_KEY = 'sidebar';
const isSidebarKey = (key: string) => key === SIDEBAR_KEY || key.endsWith(`:${SIDEBAR_KEY}`);

const inSidebar = (entry: Entry) => {
    const components = registry();
    for (let key = entry.parentFocusKey, depth = 0; key && depth < 50; depth += 1) {
        if (isSidebarKey(key)) return true;
        key = components[key]?.parentFocusKey;
    }
    return false;
};

const isVisible = (node: Element) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
        && rect.top < window.innerHeight && rect.left < window.innerWidth;
};

// the sidebar of the route on screen
const sidebarKey = () => Object.values(registry())
    .find((entry) => isSidebarKey(entry.focusKey) && entry.focusable && entry.node && isVisible(entry.node))
    ?.focusKey;

// The engine only seeds focus from a forceFocus component, which no screen
// sets. Fall back to the visible control closest to the top-left corner,
// leaving the sidebar for when the page has nothing else. A screen can mark
// a container with `data-tv-start` to start inside it instead.
const fallbackKey = ({ skipSidebar = false } = {}) => {
    const components = Object.values(registry()).filter((entry) => entry.focusable && entry.node);
    const parents = new Set(components.map((entry) => entry.parentFocusKey));
    const candidates = components
        .filter((entry) => !parents.has(entry.focusKey))
        .filter((entry) => isVisible(entry.node as Element))
        .map((entry) => {
            const rect = (entry.node as Element).getBoundingClientRect();
            return { entry, distance: Math.hypot(Math.max(rect.left, 0), Math.max(rect.top, 0)) };
        })
        .sort((a, b) => a.distance - b.distance);
    const pick = candidates.find(({ entry }) => (entry.node as Element).closest('[data-tv-start]'))
        ?? candidates.find(({ entry }) => !inSidebar(entry))
        ?? (skipSidebar ? undefined : candidates[0]);
    return pick?.entry.focusKey;
};

// Left or right can find nothing when the target shares no rows with the
// current item (sidebar buttons vs. a card row). Once the engine has settled
// and focus hasn't moved, cross between the sidebar and the content.
const crossSidebar = (direction: string) => {
    const before = getCurrentFocusKey();
    window.setTimeout(() => {
        const entry = registry()[before];
        const sidebar = sidebarKey();
        if (getCurrentFocusKey() !== before || !entry || !sidebar) return;
        if (direction === 'ArrowLeft' && !inSidebar(entry)) {
            setFocus(sidebar);
        } else if (direction === 'ArrowRight' && inSidebar(entry)) {
            const key = fallbackKey({ skipSidebar: true });
            if (key) setFocus(key);
        }
    }, 80);
};

// First arrow press with nothing focused only lands focus.
const onKeyDownCapture = (event: KeyboardEvent) => {
    for (const interceptor of interceptors) {
        if (interceptor(event)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
    }
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && hasFocus()) crossSidebar(event.key);
    if (!ARROWS.includes(event.key) || hasFocus()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const key = fallbackKey();
    if (key) setFocus(key);
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

// Keep the navigation's focus in sync when DOM focus moves some other way
// (mouse click, autofocus, element.focus()).
const onFocusIn = (event: FocusEvent) => {
    const components = registry();
    const entry = Object.entries(components).find(([, { node }]) => node === event.target);
    if (entry && entry[1].focusable && entry[0] !== getCurrentFocusKey()) {
        setFocus(entry[0]);
    }
};

const initNavigation = () => {
    init({
        shouldFocusDOMNode: true,
        useGetBoundingClientRect: true,
        distanceCalculationMethod: 'center',
    });
    setKeyMap({
        left: [37, 'ArrowLeft'],
        up: [38, 'ArrowUp'],
        right: [39, 'ArrowRight'],
        down: [40, 'ArrowDown'],
        enter: [13, 'Enter'],
    });
    // first, so keys swallowed below still switch the input mode
    initInputMode();
    window.addEventListener('keydown', onRemoteKeyCapture, true);
    window.addEventListener('keyup', onRemoteKeyCapture, true);
    window.addEventListener('keydown', onKeyDownCapture, true);
    document.addEventListener('focusin', onFocusIn);
};

export default initNavigation;
