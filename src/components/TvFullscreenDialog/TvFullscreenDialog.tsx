import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import { useFocusable, FocusContext, getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import RouterModal from 'stremio/router/Modal';
import { mergeRefs } from 'stremio/services/Input';
import { useModalsContainer } from 'stremio/router/ModalsContainerContext';
import useRouteFocused from 'stremio/common/useRouteFocused';
import Button from 'stremio/components/Button';
import styles from './TvFullscreenDialog.less';

export type DialogAction = {
    label: string,
    href?: string,
    target?: string,
    // for preferredChildFocusKey
    focusKey?: string,
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
    // the control the dialog opens on; the first one when not given
    preferredChildFocusKey?: string,
    onClose?: () => void,
};

// JS component without types
const Modal = RouterModal as React.ComponentType<{ className?: string, children?: React.ReactNode, ref?: React.Ref<HTMLElement> }>;

const ActionButton = ({ action }: { action: DialogAction }) => {
    const { ref } = useFocusable({ focusKey: action.focusKey });
    return (
        <Button ref={ref} className={styles['action']} href={action.href} target={action.target} onClick={action.onClick}>
            {action.label}
        </Button>
    );
};

const TvFullscreenDialog = ({ className, icon, image, background, eyebrow, title, message, actions, children, preferredChildFocusKey, onClose }: Props) => {
    const routeFocused = useRouteFocused();
    const modalsContainer = useModalsContainer() as HTMLElement | null;
    const containerRef = useRef<HTMLElement | null>(null);
    const { ref: focusRef, focusKey, focusSelf } = useFocusable<object, HTMLElement>({ isFocusBoundary: true, preferredChildFocusKey });

    // Opens on its first control; closing gives focus back to what had it.
    useEffect(() => {
        const opener = getCurrentFocusKey();
        focusSelf();
        return () => {
            if (opener) setFocus(opener);
        };
    }, []);

    useEffect(() => {
        if (!routeFocused || typeof onClose !== 'function') return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' && event.key !== 'Backspace' && event.key !== 'BrowserBack') return;
            // Backspace edits text fields
            if (event.key === 'Backspace' && event.target instanceof HTMLElement && event.target.matches('input, textarea, [data-text-entry]')) return;
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
        <Modal ref={mergeRefs(containerRef, focusRef)} className={classnames(className, styles['fullscreen-dialog'])}>
            <FocusContext.Provider value={focusKey}>
                {
                    background ?
                        <div className={styles['background']} style={{ backgroundImage: `url('${background}')` }} />
                        :
                        null
                }
                <div className={styles['content']}>
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
                        {actions.map((action, index) => <ActionButton key={index} action={action} />)}
                    </div>
                </div>
            </FocusContext.Provider>
        </Modal>
    );
};

export default TvFullscreenDialog;
