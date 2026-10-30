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

const hasFocus = () => {
    const key = getCurrentFocusKey();
    return typeof key === 'string' && key !== ROOT_FOCUS_KEY && doesFocusableExist(key);
};

// First arrow press with nothing focused only lands focus.
const onKeyDownCapture = (event: KeyboardEvent) => {
    if (!ARROWS.includes(event.key) || hasFocus()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setFocus(ROOT_FOCUS_KEY);
};

// Keep the navigation's focus in sync when DOM focus moves some other way
// (mouse click, autofocus, element.focus()).
type Registry = Record<string, { node: Element | null, focusable: boolean }>;
const onFocusIn = (event: FocusEvent) => {
    const components = (SpatialNavigation as unknown as { focusableComponents: Registry }).focusableComponents;
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
    window.addEventListener('keydown', onKeyDownCapture, true);
    document.addEventListener('focusin', onFocusIn);
    initInputMode();
};

export default initNavigation;
