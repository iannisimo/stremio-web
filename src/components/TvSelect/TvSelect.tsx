import React, { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import RouterModal from 'stremio/router/Modal';
import { useModalsContainer } from 'stremio/router/ModalsContainerContext';
import useBinaryState from 'stremio/common/useBinaryState';
import Button from 'stremio/components/Button';
import Label from './Label';
import { FocusContext, useFocusGroup, setFocus } from 'stremio/services/Navigation';
import styles from './TvSelect.less';

// Drop-in replacement for upstream's MultiselectMenu (same props): the label
// opens a centered list over the dimmed page. Up/Down pick, Enter selects,
// Back closes; focus returns to the label either way.

type Props = {
    className?: string,
    title?: string | (() => string | null),
    icon?: string,
    options: MultiselectMenuOption[],
    value?: any,
    disabled?: boolean,
    // upstream positions its menu in a portal; the list here always is one
    portal?: boolean,
    onSelect: (value: any) => void,
};

const Modal = RouterModal as React.ComponentType<{ className?: string, children?: React.ReactNode, ref?: React.Ref<HTMLElement>, onMouseDown?: (event: React.MouseEvent) => void }>;

let nextId = 0;

type ListProps = {
    options: MultiselectMenuOption[],
    value?: any,
    onSelect: (value: any) => void,
    onClose: () => void,
};

const List = ({ options, value, onSelect, onClose }: ListProps) => {
    const modalsContainer = useModalsContainer() as HTMLElement | null;
    const containerRef = useRef<HTMLElement | null>(null);
    const id = useRef(`select-${nextId++}`).current;
    const group = useFocusGroup<HTMLDivElement>({ focusKey: id, isFocusBoundary: true, saveLastFocusedChild: false });
    const visible = options.filter((option) => !option.hidden);
    const selectedIndex = Math.max(0, visible.findIndex((option) => option.value === value));

    useEffect(() => {
        const frame = requestAnimationFrame(() => setFocus(`${id}-${selectedIndex}`));
        return () => cancelAnimationFrame(frame);
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
        <Modal ref={containerRef} className={styles['tv-select-modal']} onMouseDown={onBackdropMouseDown}>
            <FocusContext.Provider value={group.focusKey}>
                <div ref={group.ref} className={styles['list']} role={'listbox'}>
                    <div className={styles['options']}>
                        {
                            visible.map((option, index) => (
                                <Button
                                    key={`${index}-${option.value}`}
                                    className={classNames(styles['option'], { [styles['selected']]: option.value === value })}
                                    focusKey={`${id}-${index}`}
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
                                </Button>
                            ))
                        }
                    </div>
                </div>
            </FocusContext.Provider>
        </Modal>
    );
};

const TvSelect = ({ className, title, icon, options, value, disabled, onSelect }: Props) => {
    const [open, openList, closeList] = useBinaryState(false);
    const labelRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((option) => option.value === value);
    const labelText = typeof title === 'function' ? title() : title ?? selectedOption?.label;

    const close = useCallback(() => {
        closeList();
        // back to the label, which the list's focus boundary took focus from
        requestAnimationFrame(() => {
            const button = labelRef.current?.querySelector<HTMLElement>('[tabindex]');
            button?.focus();
        });
    }, [closeList]);

    const select = useCallback((selected: any) => {
        close();
        if (selected !== value) onSelect(selected);
    }, [close, onSelect, value]);

    return (
        <div ref={labelRef} className={classNames(className, styles['tv-select'], { [styles['active']]: open })}>
            <Label text={labelText} icon={icon} disabled={disabled} open={open} onClick={openList} />
            {
                open ?
                    <List options={options} value={value} onSelect={select} onClose={close} />
                    :
                    null
            }
        </div>
    );
};

export default TvSelect;
