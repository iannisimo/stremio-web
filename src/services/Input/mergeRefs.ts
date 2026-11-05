import type { MutableRefObject, Ref } from 'react';

const mergeRefs = <T>(...refs: (Ref<T> | undefined)[]) => (element: T | null) => {
    refs.forEach((ref) => {
        if (typeof ref === 'function') ref(element);
        else if (ref) (ref as MutableRefObject<T | null>).current = element;
    });
};

export default mergeRefs;
