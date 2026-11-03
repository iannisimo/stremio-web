// Focus handler for scrolling rows: the newly focused child scrolls fully into view.
const keepFocusedInView = (event: FocusEvent | React.FocusEvent) => {
    if (event.target instanceof HTMLElement) {
        event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
};

export default keepFocusedInView;
