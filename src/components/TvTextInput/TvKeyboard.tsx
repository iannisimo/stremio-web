import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import Keyboard from 'react-simple-keyboard';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type { KeyPressDetails } from '@noriginmedia/norigin-spatial-navigation';
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
    focusKey?: string,
    inputRef: RefObject<HTMLInputElement | null>,
    // start the highlight on Done instead of the first letter
    startOnDone?: boolean,
    onDone: () => void,
};

type Cursor = { row: number, col: number };

const findKey = (rows: string[][], key: string): Cursor => {
    const row = rows.findIndex((keys) => keys.includes(key));
    return { row, col: rows[row].indexOf(key) };
};

const centerX = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return rect.left + rect.width / 2;
};

// On-screen keyboard for the text editor. One focus stop: the arrows move a
// highlighted key, Enter presses it. ← / → wrap at the row's ends, but a held
// arrow stops there; ↑ / ↓ go to the nearest key and leave past the first and
// last rows.
const TvKeyboard = ({ focusKey, inputRef, startOnDone, onDone }: Props) => {
    const [layoutName, setLayoutName] = useState<keyof typeof LAYOUT>('default');
    const rows = useMemo(() => LAYOUT[layoutName].map((row) => row.split(' ')), [layoutName]);
    const [cursor, setCursor] = useState<Cursor>(() => (startOnDone ? findKey(rows, '{enter}') : { row: 1, col: 0 }));
    // the layouts' rows aren't all the same length
    const row = Math.min(cursor.row, rows.length - 1);
    const col = Math.min(cursor.col, rows[row].length - 1);

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

    // A real keyboard still types while the on-screen one has focus. The app's
    // shortcuts (Backspace, digits, F) only skip real inputs, so stop them here.
    // Typing on it moves the highlight to Done, ready to submit.
    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        const input = inputRef.current;
        if (!input || event.ctrlKey || event.metaKey || event.altKey) return;
        // Enter (and the remote's Select) presses the highlighted key. Not
        // Norigin's onEnterPress: that runs late and would also see the Enter
        // that opened the editor.
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!event.repeat) press(rows[row][col]);
            return;
        }
        if (event.key.length === 1) {
            insert(input, event.key);
        } else if (event.key === 'Backspace') {
            deleteBack(input);
        } else {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        setCursor(findKey(rows, '{enter}'));
    }, [press, rows, row, col]);

    const onArrowPress = useCallback((direction: string, _props: object, details: KeyPressDetails) => {
        const held = (details.pressedKeys[direction] ?? 0) > 1;
        if (direction === 'left' || direction === 'right') {
            const step = direction === 'left' ? -1 : 1;
            const length = rows[row].length;
            const next = col + step;
            if (next < 0 || next >= length) {
                if (!held) setCursor({ row, col: (next + length) % length });
            } else {
                setCursor({ row, col: next });
            }
            return false;
        }
        const nextRow = row + (direction === 'up' ? -1 : 1);
        if (nextRow < 0 || nextRow >= rows.length) return true;
        const rowElements = ref.current?.querySelectorAll('.hg-row');
        const from = rowElements?.[row]?.children[col];
        const targets = Array.from(rowElements?.[nextRow]?.children ?? []);
        if (!from || targets.length === 0) return false;
        const x = centerX(from);
        const nearest = targets.reduce((best, element, index) => (
            Math.abs(centerX(element) - x) < Math.abs(centerX(targets[best]) - x) ? index : best
        ), 0);
        setCursor({ row: nextRow, col: nearest });
        return false;
    }, [rows, row, col]);

    const { ref, focused } = useFocusable<object, HTMLDivElement>({ focusKey, onArrowPress });

    // the library draws the keys, so the highlight goes on its DOM
    useEffect(() => {
        const rowElements = ref.current?.querySelectorAll('.hg-row');
        const key = focused ? rowElements?.[row]?.children[col] : null;
        ref.current?.querySelectorAll(`.${styles['active']}`).forEach((element) => {
            if (element !== key) element.classList.remove(styles['active']);
        });
        key?.classList.add(styles['active']);
    }, [focused, layoutName, row, col]);

    return (
        <div ref={ref} className={styles['keyboard']} tabIndex={-1} data-text-entry={true} onKeyDown={onKeyDown}>
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
