import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import Keyboard from 'react-simple-keyboard';
import { useFocusable, mergeRefs } from 'stremio/services/Navigation';
import styles from './TvKeyboard.less';

const LAYOUT = {
    default: [
        '1 2 3 4 5 6 7 8 9 0',
        'q w e r t y u i o p',
        'a s d f g h j k l @',
        '{shift} z x c v b n m . {bksp}',
        '{sym} - _ {space} / : {enter}',
    ],
    shift: [
        '1 2 3 4 5 6 7 8 9 0',
        'Q W E R T Y U I O P',
        'A S D F G H J K L @',
        '{shift} Z X C V B N M . {bksp}',
        '{sym} - _ {space} / : {enter}',
    ],
    sym: [
        '1 2 3 4 5 6 7 8 9 0',
        '! ? # $ % & * ( ) =',
        '+ ~ ^ ; \' " < > [ ]',
        '{abc} , | \\ ` € £ . {bksp}',
        '{abc} - _ {space} / : {enter}',
    ],
};

// Key labels are HTML. Same paths as the stremio-icons "delete" icon.
const BACKSPACE_ICON = '<svg class="tv-key-icon" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="32" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M438 112H190c-12 0-23 5-31 14L48 256l111 130c8 9 19 14 31 14h248c21 0 38-17 38-38V150c0-21-17-38-38-38Z"/>'
    + '<path d="m318 208-96 96M222 208l96 96"/>'
    + '</svg>';

const DISPLAY = {
    '{bksp}': BACKSPACE_ICON,
    '{shift}': '⇧',
    '{space}': 'Space',
    '{enter}': 'Done',
    '{sym}': '?123',
    '{abc}': 'ABC',
};

const ACTIVE = styles['active'];

const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

// Sets the value the way typing would, so React's onChange fires.
const setInputValue = (input: HTMLInputElement, value: string, caret: number) => {
    valueSetter?.call(input, value);
    // email inputs have no selection API
    if (input.selectionStart !== null) input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

const selection = (input: HTMLInputElement) => [
    input.selectionStart ?? input.value.length,
    input.selectionEnd ?? input.value.length,
];

const insert = (input: HTMLInputElement, text: string) => {
    const [start, end] = selection(input);
    setInputValue(input, input.value.slice(0, start) + text + input.value.slice(end), start + text.length);
};

const deleteBack = (input: HTMLInputElement) => {
    const [start, end] = selection(input);
    const from = start === end ? Math.max(0, start - 1) : start;
    setInputValue(input, input.value.slice(0, from) + input.value.slice(end), from);
};

type Props = {
    inputRef: RefObject<HTMLInputElement | null>,
    focusKey: string,
    onDone: () => void,
};

// On-screen keyboard for the text editor. Navigation sees it as one focus
// stop; arrows move between keys and leave it only past the top or bottom row.
const TvKeyboard = ({ inputRef, focusKey, onDone }: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const position = useRef({ row: 1, col: 0 });
    const held = useRef(false);

    // Arrow handlers don't get the event; note auto-repeat before they run.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            held.current = event.repeat;
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, []);
    const [layoutName, setLayoutName] = useState<keyof typeof LAYOUT>('default');

    const grid = () => Array.from(containerRef.current?.querySelectorAll('.hg-row') ?? [])
        .map((row) => Array.from(row.querySelectorAll<HTMLElement>('.hg-button')));

    const current = () => {
        const rows = grid();
        const { row, col } = position.current;
        return rows[row]?.[Math.min(col, rows[row].length - 1)] ?? null;
    };

    const press = useCallback((button: string) => {
        const input = inputRef.current;
        if (!input) return;
        switch (button) {
            case '{bksp}': deleteBack(input); break;
            case '{space}': insert(input, ' '); break;
            case '{shift}': setLayoutName((name) => name === 'shift' ? 'default' : 'shift'); break;
            case '{sym}': setLayoutName('sym'); break;
            case '{abc}': setLayoutName('default'); break;
            case '{enter}': onDone(); break;
            default:
                insert(input, button);
                // shift is for one letter
                setLayoutName((name) => name === 'shift' ? 'default' : name);
        }
    }, [onDone]);

    const move = (direction: string) => {
        const rows = grid();
        let { row, col } = position.current;
        col = Math.min(col, rows[row].length - 1);
        if (direction === 'left' || direction === 'right') {
            // wraps around within the row, but a held key stops at the edge
            const length = rows[row].length;
            const next = col + (direction === 'left' ? -1 : 1);
            if ((next < 0 || next >= length) && held.current) return false;
            col = (next + length) % length;
        } else {
            const nextRow = row + (direction === 'up' ? -1 : 1);
            // past the edge: let the navigation take over (input above, buttons below)
            if (nextRow < 0 || nextRow >= rows.length) return true;
            // the key in the next row closest under / above this one
            const box = rows[row][col].getBoundingClientRect();
            const x = box.left + box.width / 2;
            col = rows[nextRow].reduce((best, key, index) => {
                const rect = key.getBoundingClientRect();
                const bestRect = rows[nextRow][best].getBoundingClientRect();
                return Math.abs(rect.left + rect.width / 2 - x) < Math.abs(bestRect.left + bestRect.width / 2 - x) ? index : best;
            }, 0);
            row = nextRow;
        }
        position.current = { row, col };
        highlight();
        return false;
    };

    const { ref: focusRef, focused } = useFocusable<object, HTMLDivElement>({
        focusKey,
        onArrowPress: move,
        onEnterPress: () => {
            const key = current();
            const button = key?.getAttribute('data-skbtn');
            if (button) press(button);
        },
    });

    const highlight = () => {
        containerRef.current?.querySelectorAll(`.${ACTIVE}`).forEach((key) => key.classList.remove(ACTIVE));
        if (focused) current()?.classList.add(ACTIVE);
    };

    // the keyboard redraws its keys on layout changes
    useEffect(() => {
        const frame = requestAnimationFrame(highlight);
        return () => cancelAnimationFrame(frame);
    }, [focused, layoutName]);

    // A real keyboard still types while the on-screen one has focus. The app's
    // shortcuts (Backspace, digits, F) only skip real inputs, so stop them here.
    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        const input = inputRef.current;
        if (!input || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key.length === 1) {
            insert(input, event.key);
        } else if (event.key === 'Backspace') {
            deleteBack(input);
        } else {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }, []);

    return (
        <div ref={mergeRefs(containerRef, focusRef)} className={styles['keyboard']} tabIndex={-1} data-text-entry={true} data-tv-arrows={true} onKeyDown={onKeyDown}>
            <Keyboard
                theme={'hg-theme-default tv-keyboard'}
                layout={LAYOUT}
                layoutName={layoutName}
                display={DISPLAY}
                onKeyPress={press}
                disableButtonHold={true}
                preventMouseDownDefault={true}
            />
        </div>
    );
};

export default TvKeyboard;
