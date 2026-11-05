import { init } from '@noriginmedia/norigin-spatial-navigation';
import initBackFallback from './backFallback';

// ?debug before or after the hash: Norigin's overlay and console log
const hasDebugParam = () => {
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    return new URLSearchParams(window.location.search).has('debug') || new URLSearchParams(hashQuery).has('debug');
};

const initNavigation = () => {
    const debug = hasDebugParam();
    init({
        // real DOM focus follows, so Enter, long press and :focus styles keep working;
        // the browser scrolls the focused element into view
        shouldFocusDOMNode: true,
        debug,
        visualDebug: debug,
    });
    initBackFallback();
};

export { initNavigation };
export { default as usePageFocus } from './usePageFocus';
export { default as usePageStartFocus } from './usePageStartFocus';
export { default as useRailBack } from './useRailBack';
export { SuspenseFallbackProvider, useInSuspenseFallback } from './SuspenseFallback';
export { default as FocusButton, FOCUS_KEY_ATTRIBUTE } from './FocusButton';
export { default as FocusGroup } from './FocusGroup';
