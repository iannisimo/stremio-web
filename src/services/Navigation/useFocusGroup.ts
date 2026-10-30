import { useFocusable, UseFocusableConfig } from '@noriginmedia/norigin-spatial-navigation';

type Options = Pick<UseFocusableConfig,
    'focusKey' | 'saveLastFocusedChild' | 'preferredChildFocusKey' | 'isFocusBoundary' | 'focusBoundaryDirections' | 'trackChildren'>;

// A non-focusable container that groups its focusable children.
// Wrap the children in <FocusContext.Provider value={focusKey}>.
const useFocusGroup = <E extends HTMLElement = HTMLElement>(options: Options = {}) => {
    const { ref, focusKey, hasFocusedChild, focusSelf } = useFocusable<object, E>({
        saveLastFocusedChild: true,
        trackChildren: true,
        ...options,
        focusable: true,
    });
    return { ref, focusKey, hasFocusedChild, focusSelf };
};

export default useFocusGroup;
