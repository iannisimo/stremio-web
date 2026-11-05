import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentProps, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import TvFullscreenDialog from 'stremio/components/TvFullscreenDialog';
import TextInput from 'stremio/components/TextInput/TextInput';
import Button from 'stremio/components/Button';
import { mergeRefs } from 'stremio/services/Input';
import TvKeyboard from './TvKeyboard';
import styles from './TvTextInput.less';

type Props = ComponentProps<typeof TextInput> & {
    // shown in the editor, picking one submits it
    suggestions?: string[],
    // the page field's focus key, e.g. for the page's start focus
    focusKey?: string,
};

type EditorProps = {
    title: string,
    // the page field it edits, kept in sync; without one the editor stands alone
    field?: HTMLInputElement,
    inputProps: ComponentProps<typeof TextInput>,
    suggestions?: string[],
    // the keyboard starts on Done, e.g. when the text is ready to submit
    startOnDone?: boolean,
    // after: the submit, to run once the editor is closed
    onClose: (after?: () => void) => void,
};

// Enough of a keyboard event for callers that read currentTarget.value.
const submitEvent = (input: HTMLInputElement) => ({
    key: 'Enter',
    target: input,
    currentTarget: input,
    preventDefault: () => null,
    stopPropagation: () => null,
}) as unknown as KeyboardEvent<HTMLInputElement>;

const SUGGESTION_COUNT = 10;
const SUGGESTION_LENGTH = 22;

const shorten = (text: string) => text.length > SUGGESTION_LENGTH ? `${text.slice(0, SUGGESTION_LENGTH - 1).trimEnd()}…` : text;

// one editor is open at a time
const KEYBOARD_FOCUS_KEY = 'text-editor:keyboard';

const Suggestion = ({ item, onPick }: { item: string, onPick: (text: string) => void }) => {
    const { ref } = useFocusable();
    return (
        <Button ref={ref} className={styles['suggestion']} title={item} onClick={() => onPick(item)}>
            <span className={styles['suggestion-label']}>{shorten(item)}</span>
        </Button>
    );
};

const Suggestions = ({ items, onPick }: { items: string[], onPick: (text: string) => void }) => (
    <div className={styles['suggestions']}>
        {items.map((item) => <Suggestion key={item} item={item} onPick={onPick} />)}
    </div>
);

// ← / → move the caret, ↑ / ↓ leave. Norigin cancels the arrows' default
// action, so the caret is moved here.
const moveCaret = (input: HTMLInputElement | null, direction: string) => {
    if (direction !== 'left' && direction !== 'right') return true;
    // email inputs have no selection API
    if (!input || input.selectionStart === null) return false;
    const { selectionStart: start, selectionEnd: end, value } = input;
    const caret = start !== end ?
        (direction === 'left' ? start : end ?? start)
        :
        Math.max(0, Math.min(value.length, start + (direction === 'left' ? -1 : 1)));
    input.setSelectionRange(caret, caret);
    return false;
};

// Inside the dialog, so it is one of the dialog's focus stops.
const EditorInput = forwardRef<HTMLInputElement, ComponentProps<typeof TextInput>>((props, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const onArrowPress = useCallback((direction: string) => moveCaret(inputRef.current, direction), []);
    const { ref: focusRef } = useFocusable<object, HTMLInputElement>({ onArrowPress });
    return <TextInput {...props} ref={mergeRefs(ref, inputRef, focusRef)} />;
});

EditorInput.displayName = 'EditorInput';

const Editor = ({ title, field, inputProps, suggestions, startOnDone, onClose }: EditorProps) => {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement | null>(null);

    // the page field's classes and styles don't fit the editor
    const { onChange, onSubmit, className: _className, style: _style, defaultValue, ...rest } = inputProps;

    // The field on the page is what callers read (ref.current.value), keep it current.
    const change = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (field) field.value = event.currentTarget.value;
        onChange?.(event);
    }, [field, onChange]);

    // After closing. React clears currentTarget once the handler returns,
    // so hand over our own event.
    const submit = useCallback(() => {
        const input = inputRef.current;
        onClose(() => {
            if (input) onSubmit?.(submitEvent(input));
        });
    }, [onSubmit, onClose]);

    const pick = useCallback((text: string) => {
        const input = inputRef.current;
        if (!input) return;
        input.value = text;
        if (field) field.value = text;
        onChange?.({ target: input, currentTarget: input } as React.ChangeEvent<HTMLInputElement>);
        submit();
    }, [field, onChange, submit]);

    // Changes go out live (search suggestions), so cancel puts the old value back.
    const initialValue = useRef(field?.value ?? String(defaultValue ?? '')).current;
    const cancel = useCallback(() => {
        const input = inputRef.current;
        if (input && input.value !== initialValue) {
            input.value = initialValue;
            if (field) field.value = initialValue;
            onChange?.({ target: input, currentTarget: input } as React.ChangeEvent<HTMLInputElement>);
        }
        onClose();
    }, [field, onChange, onClose]);

    return (
        <TvFullscreenDialog
            title={title}
            actions={[{ label: t('BUTTON_CANCEL'), onClick: cancel }]}
            preferredChildFocusKey={KEYBOARD_FOCUS_KEY}
            onClose={cancel}
        >
            <EditorInput
                {...rest}
                ref={inputRef}
                className={styles['editor-input']}
                defaultValue={initialValue}
                value={undefined}
                onChange={change}
                onSubmit={submit}
            />
            {
                suggestions ?
                    <Suggestions items={suggestions.slice(0, SUGGESTION_COUNT)} onPick={pick} />
                    :
                    null
            }
            <TvKeyboard focusKey={KEYBOARD_FOCUS_KEY} inputRef={inputRef} startOnDone={startOnDone} onDone={submit} />
        </TvFullscreenDialog>
    );
};

// Text fields open a full-screen editor instead of taking keys in place.
const TvTextInput = forwardRef<HTMLInputElement, Props>(({ suggestions, focusKey, ...props }, ref) => {
    const fieldRef = useRef<HTMLInputElement | null>(null);
    const [editing, setEditing] = useState(false);
    const editable = !props.readOnly && !props.disabled;
    const { ref: focusRef } = useFocusable<object, HTMLInputElement>({ focusKey, focusable: editable });

    const open = useCallback(() => {
        if (editable) setEditing(true);
    }, [editable]);

    const close = useCallback((after?: () => void) => {
        setEditing(false);
        if (after) requestAnimationFrame(after);
    }, []);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        props.onKeyDown?.(event);
        if (event.key === 'Enter' && !event.repeat) open();
    }, [props.onKeyDown, open]);

    useEffect(() => {
        if (props.autoFocus && editable) open();
    }, []);

    const onClick = useCallback((event: React.MouseEvent<HTMLInputElement>) => {
        props.onClick?.(event);
        open();
    }, [props.onClick, open]);

    if (!editable) {
        return <TextInput ref={mergeRefs(ref, focusRef)} {...props} />;
    }

    const { className, style, type, placeholder, value, defaultValue, title } = props;

    return (
        <React.Fragment>
            <TextInput
                ref={mergeRefs(ref, fieldRef, focusRef)}
                className={classnames(className, styles['field'])}
                style={style}
                type={type}
                title={title}
                placeholder={placeholder}
                value={value}
                defaultValue={defaultValue}
                readOnly={true}
                tabIndex={0}
                onClick={onClick}
                onKeyDown={onKeyDown}
            />
            {
                editing && fieldRef.current ?
                    <Editor
                        title={placeholder || title || ''}
                        field={fieldRef.current}
                        inputProps={props}
                        suggestions={suggestions}
                        onClose={close}
                    />
                    :
                    null
            }
        </React.Fragment>
    );
});

TvTextInput.displayName = 'TvTextInput';

// the editor on its own, for text that isn't a page field (Play URL)
export { Editor as TvTextEditor };

export default TvTextInput;
