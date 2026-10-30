import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import RouterModal from 'stremio/router/Modal';
import { useModalsContainer } from 'stremio/router/ModalsContainerContext';
import useRouteFocused from 'stremio/common/useRouteFocused';
import { FocusContext, useFocusGroup, setFocus } from 'stremio/services/Navigation';
import Button from 'stremio/components/Button';
import styles from './FullscreenDialog.less';

export type DialogAction = {
    label: string,
    focusKey?: string,
    href?: string,
    target?: string,
    onClick?: () => void,
};

type Props = {
    className?: string,
    icon?: string,
    image?: string,
    background?: string,
    eyebrow?: string,
    title: string,
    message?: string,
    actions: DialogAction[],
    children?: React.ReactNode,
    initialFocusKey?: string,
    onClose?: () => void,
};

// JS component without types
const Modal = RouterModal as React.ComponentType<{ className?: string, children?: React.ReactNode, ref?: React.Ref<HTMLElement> }>;

let nextId = 0;

const FullscreenDialog = ({ className, icon, image, background, eyebrow, title, message, actions, children, initialFocusKey, onClose }: Props) => {
    const routeFocused = useRouteFocused();
    const modalsContainer = useModalsContainer() as HTMLElement | null;
    const containerRef = useRef<HTMLElement | null>(null);
    const id = useRef(`dialog-${nextId++}`).current;
    const group = useFocusGroup<HTMLDivElement>({ focusKey: id, isFocusBoundary: true, saveLastFocusedChild: false });

    useEffect(() => {
        const frame = requestAnimationFrame(() => setFocus(initialFocusKey ?? actions[0]?.focusKey ?? `${id}-action-0`));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!routeFocused || typeof onClose !== 'function') return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' && event.key !== 'Backspace' && event.key !== 'BrowserBack') return;
            // Backspace edits text fields
            if (event.key === 'Backspace' && event.target instanceof HTMLElement && event.target.matches('input, textarea')) return;
            // only the top-most dialog reacts
            const modals = Array.from(modalsContainer?.querySelectorAll(':scope > .modal-container') ?? []);
            if (modals[modals.length - 1] !== containerRef.current) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            onClose();
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [routeFocused, onClose]);

    return (
        <Modal ref={containerRef} className={classnames(className, styles['fullscreen-dialog'])}>
            {
                background ?
                    <div className={styles['background']} style={{ backgroundImage: `url('${background}')` }} />
                    :
                    null
            }
            <FocusContext.Provider value={group.focusKey}>
                <div ref={group.ref} className={styles['content']}>
                    {
                        image ?
                            <img className={styles['image']} src={image} alt={''} />
                            :
                            icon ?
                                <Icon className={styles['icon']} name={icon} />
                                :
                                null
                    }
                    {
                        eyebrow ?
                            <div className={styles['eyebrow']}>{eyebrow}</div>
                            :
                            null
                    }
                    <h1 className={styles['title']}>{title}</h1>
                    {
                        message ?
                            <p className={styles['message']}>{message}</p>
                            :
                            null
                    }
                    {children}
                    <div className={styles['actions']}>
                        {
                            actions.map((action, index) => (
                                <Button
                                    key={index}
                                    className={styles['action']}
                                    focusKey={action.focusKey ?? `${id}-action-${index}`}
                                    href={action.href}
                                    target={action.target}
                                    onClick={action.onClick}
                                >
                                    {action.label}
                                </Button>
                            ))
                        }
                    </div>
                </div>
            </FocusContext.Provider>
        </Modal>
    );
};

export default FullscreenDialog;
