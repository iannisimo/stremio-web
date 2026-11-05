import React, { forwardRef } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import Button from 'stremio/components/Button';
import { mergeRefs } from 'stremio/services/Input';

type Props = React.ComponentProps<typeof Button> & {
    focusKey?: string,
};

// The element's focus key, for code that finds focus stops in the DOM (popups
// opening on their selected option).
export const FOCUS_KEY_ATTRIBUTE = 'data-focus-key';

// Upstream's Button as a focus stop.
const FocusButton = forwardRef<HTMLElement, Props>(({ focusKey, ...props }, ref) => {
    const { ref: focusRef, focusKey: key } = useFocusable({ focusKey });
    return <Button ref={mergeRefs(ref, focusRef)} {...{ [FOCUS_KEY_ATTRIBUTE]: key }} {...props} />;
});

FocusButton.displayName = 'FocusButton';

export default FocusButton;
