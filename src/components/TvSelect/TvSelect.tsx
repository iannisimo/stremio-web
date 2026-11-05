import React, { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { useFocusable, FocusContext, getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import RouterModal from 'stremio/router/Modal';
import { useModalsContainer } from 'stremio/router/ModalsContainerContext';
import useBinaryState from 'stremio/common/useBinaryState';
import { mergeRefs } from 'stremio/services/Input';
import { FocusButton } from 'stremio/services/Navigation';
import Label from './Label';
import styles from './TvSelect.less';

// Drop-in replacement for upstream's MultiselectMenu (same props): the label
// opens a centered list over the dimmed page. Enter selects, Back closes.

type Props = {
    className?: string,
    title?: string | (() => string | null),
    icon?: string,
    options: MultiselectMenuOption[],
    value?: any,
    disabled?: boolean,
    // upstream positions its menu in a portal; the list here always is one
    portal?: boolean,
    // the label's focus key, for code that moves focus to it
    focusKey?: string,
    onSelect: (value: any) => void,
};

const Modal = RouterModal as React.ComponentType<{ className?: string, children?: React.ReactNode, ref?: React.Ref<HTMLElement>, onMouseDown?: (event: React.MouseEvent) => void }>;

type ListProps = {
    options: MultiselectMenuOption[],
    value?: any,
    onSelect: (value: any) => void,
    onClose: () => void,
};

// Arrows stay in the list; it opens on the selected option, closing gives
// focus back to the label.
const List = ({ options, value, onSelect, onClose }: ListProps) => {
    const modalsContainer = useModalsContainer() as HTMLElement | null;
    const containerRef = useRef<HTMLElement | null>(null);
    const visible = options.filter((option) => !option.hidden);
    const { ref: focusRef, focusKey } = useFocusable<object, HTMLElement>({ isFocusBoundary: true });
    const optionFocusKey = (index: number) => `${focusKey}:${index}`;

    useEffect(() => {
        const opener = getCurrentFocusKey();
        const selected = visible.findIndex((option) => option.value === value);
        setFocus(selected >= 0 ? optionFocusKey(selected) : focusKey);
        return () => {
            if (opener) setFocus(opener);
        };
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' && event.key !== 'Backspace' && event.key !== 'BrowserBack') return;
            // only the top-most modal reacts
            const modals = Array.from(modalsContainer?.querySelectorAll(':scope > .modal-container') ?? []);
            if (modals[modals.length - 1] !== containerRef.current) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            onClose();
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [onClose]);

    const onBackdropMouseDown = useCallback((event: React.MouseEvent) => {
        if (event.target === event.currentTarget) onClose();
    }, [onClose]);

    return (
        <Modal ref={mergeRefs(containerRef, focusRef)} className={styles['tv-select-modal']} onMouseDown={onBackdropMouseDown}>
            <FocusContext.Provider value={focusKey}>
                <div className={styles['list']} role={'listbox'}>
                    <div className={styles['options']}>
                        {
                            visible.map((option, index) => (
                                <FocusButton
                                    key={`${index}-${option.value}`}
                                    focusKey={optionFocusKey(index)}
                                    className={classNames(styles['option'], { [styles['selected']]: option.value === value })}
                                    role={'option'}
                                    onClick={() => onSelect(option.value)}
                                >
                                    <span className={styles['label']}>{option.label}</span>
                                    {
                                        option.value === value ?
                                            <span className={styles['check']} />
                                            :
                                            null
                                    }
                                </FocusButton>
                            ))
                        }
                    </div>
                </div>
            </FocusContext.Provider>
        </Modal>
    );
};

const TvSelect = ({ className, title, icon, options, value, disabled, focusKey, onSelect }: Props) => {
    const [open, openList, closeList] = useBinaryState(false);
    const selectedOption = options.find((option) => option.value === value);
    const labelText = typeof title === 'function' ? title() : title ?? selectedOption?.label;

    const select = useCallback((selected: any) => {
        closeList();
        if (selected !== value) onSelect(selected);
    }, [closeList, onSelect, value]);

    return (
        <div className={classNames(className, styles['tv-select'], { [styles['active']]: open })}>
            <Label text={labelText} icon={icon} disabled={disabled} open={open} focusKey={focusKey} onClick={openList} />
            {
                open ?
                    <List options={options} value={value} onSelect={select} onClose={closeList} />
                    :
                    null
            }
        </div>
    );
};

export default TvSelect;
