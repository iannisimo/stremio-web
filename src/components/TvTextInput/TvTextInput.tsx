import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentProps, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import FullscreenDialog from 'stremio/components/FullscreenDialog';
import TextInput from 'stremio/components/TextInput/TextInput';
import { useFocusable, setFocus, mergeRefs } from 'stremio/services/Navigation';
import TvKeyboard from './TvKeyboard';
import styles from './TvTextInput.less';

type Props = ComponentProps<typeof TextInput> & {
    focusKey?: string,
};

type EditorProps = {
    title: string,
    field: HTMLInputElement,
    inputProps: ComponentProps<typeof TextInput>,
    onClose: (after?: () => void) => void,
};

let nextId = 0;
const EDIT_KEY_PREFIX = 'text-input-edit-';

// Enough of a keyboard event for callers that read currentTarget.value.
const submitEvent = (input: HTMLInputElement) => ({
    key: 'Enter',
    target: input,
    currentTarget: input,
    preventDefault: () => null,
    stopPropagation: () => null,
}) as unknown as KeyboardEvent<HTMLInputElement>;

const Editor = ({ title, field, inputProps, onClose }: EditorProps) => {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const editKey = useRef(`${EDIT_KEY_PREFIX}${nextId++}`).current;
    // Left/right move the caret; up/down leave the field.
    const { ref: focusRef } = useFocusable<object, HTMLInputElement>({
        focusKey: editKey,
        onArrowPress: (direction) => direction === 'up' || direction === 'down',
    });

    // the page field's classes and styles don't fit the editor
    const { onChange, onSubmit, className: _className, style: _style, ...rest } = inputProps;

    // The field on the page is what callers read (ref.current.value), keep it current.
    const change = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        field.value = event.currentTarget.value;
        onChange?.(event);
    }, [field, onChange]);

    // After closing, so focus moves made by onSubmit win. React clears
    // currentTarget once the handler returns, so hand over our own event.
    const submit = useCallback(() => {
        const input = inputRef.current;
        onClose(() => {
            if (input) onSubmit?.(submitEvent(input));
        });
    }, [onSubmit, onClose]);

    // Changes go out live (search suggestions), so cancel puts the old value back.
    const initialValue = useRef(field.value).current;
    const cancel = useCallback(() => {
        const input = inputRef.current;
        if (input && input.value !== initialValue) {
            input.value = initialValue;
            field.value = initialValue;
            onChange?.({ target: input, currentTarget: input } as React.ChangeEvent<HTMLInputElement>);
        }
        onClose();
    }, [field, onChange, onClose]);

    return (
        <FullscreenDialog
            title={title}
            actions={[{ label: t('BUTTON_CANCEL'), onClick: cancel }]}
            initialFocusKey={`${editKey}-keyboard`}
            onClose={cancel}
        >
            <TextInput
                {...rest}
                ref={mergeRefs(inputRef, focusRef)}
                className={styles['editor-input']}
                defaultValue={field.value}
                value={undefined}
                onChange={change}
                onSubmit={submit}
            />
            <TvKeyboard inputRef={inputRef} focusKey={`${editKey}-keyboard`} onDone={submit} />
        </FullscreenDialog>
    );
};

// Text fields open a full-screen editor instead of taking keys in place,
// so the remote can move over them.
const TvTextInput = forwardRef<HTMLInputElement, Props>(({ focusKey, ...props }, ref) => {
    const fieldRef = useRef<HTMLInputElement | null>(null);
    const ownKey = useRef(`text-input-${nextId++}`).current;
    const key = focusKey ?? ownKey;
    const [editing, setEditing] = useState(false);
    const editable = !props.readOnly && !props.disabled;

    const open = useCallback(() => {
        if (editable) setEditing(true);
    }, [editable]);

    const close = useCallback((after?: () => void) => {
        setEditing(false);
        requestAnimationFrame(() => {
            setFocus(key);
            after?.();
        });
    }, [key]);

    const { ref: focusRef } = useFocusable<object, HTMLInputElement>({
        focusKey: key,
        focusable: editable,
        onEnterPress: open,
    });

    useEffect(() => {
        if (props.autoFocus && editable) open();
    }, []);

    const onClick = useCallback((event: React.MouseEvent<HTMLInputElement>) => {
        props.onClick?.(event);
        open();
    }, [props.onClick, open]);

    if (!editable) {
        return <TextInput ref={ref} {...props} />;
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
            />
            {
                editing && fieldRef.current ?
                    <Editor
                        title={placeholder || title || ''}
                        field={fieldRef.current}
                        inputProps={props}
                        onClose={close}
                    />
                    :
                    null
            }
        </React.Fragment>
    );
});

TvTextInput.displayName = 'TvTextInput';

export default TvTextInput;
