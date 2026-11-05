import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

// One per mounted page: arrows never leave it, and it remembers where focus was.
const usePageFocus = (focusKey: string) => {
    const { ref } = useFocusable<object, HTMLDivElement>({
        focusKey,
        isFocusBoundary: true,
        saveLastFocusedChild: true,
    });

    return ref;
};

export default usePageFocus;
