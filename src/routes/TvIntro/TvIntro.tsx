import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { useCore } from 'stremio/core';
import useRouteFocused, { useRouteActive } from 'stremio/common/useRouteFocused';
import { FocusButton as Button } from 'stremio/services/Navigation';
import TextInput from 'stremio/components/TextInput';
import useLinkCode from './useLinkCode';
import styles from './TvIntro.less';

type Mode = 'code' | 'standard';

const isBackKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'BrowserBack') return true;
    // Backspace edits text fields
    return event.key === 'Backspace' && !(event.target instanceof HTMLElement && event.target.matches('input, textarea'));
};

const Field = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput className={styles['field']} {...props} />
);

type CodeLoginProps = {
    onStandardLogin: () => void,
    onGuest: () => void,
};

const CodeLogin = ({ onStandardLogin, onGuest }: CodeLoginProps) => {
    const { t } = useTranslation();
    const { linkCode, status, refresh } = useLinkCode(true);

    const message =
        status === 'signing-in' ? t('AUTHENTICATING') :
            status === 'error' ? 'Couldn\'t log in with this code. Get a new one and try again.' :
                'Scan the QR code with your phone, or open link.stremio.com on any device and enter the code.';

    return (
        <div className={styles['panel']}>
            <div className={styles['text']}>
                <h1 className={styles['title']}>Log in to Stremio</h1>
                <p className={styles['message']}>{message}</p>
                <div className={styles['actions']}>
                    {
                        status === 'error' ?
                            <Button focusKey={'intro:new-code'} className={styles['action']} onClick={refresh}>New code</Button>
                            :
                            null
                    }
                    <Button focusKey={'intro:standard'} className={styles['action']} onClick={onStandardLogin}>Standard login</Button>
                    <Button focusKey={'intro:guest'} className={styles['action']} onClick={onGuest}>Enter as guest</Button>
                </div>
            </div>
            <div className={classnames(styles['code-container'], { [styles['dimmed']]: status !== 'waiting' })}>
                {
                    linkCode ?
                        <React.Fragment>
                            <img className={styles['qrcode']} src={linkCode.qrcode} alt={''} />
                            <div className={styles['url']}>link.stremio.com</div>
                            <div className={styles['code']}>{linkCode.code}</div>
                        </React.Fragment>
                        :
                        <div className={styles['qrcode']} />
                }
            </div>
        </div>
    );
};

const StandardLogin = ({ onBack }: { onBack: () => void }) => {
    const { t } = useTranslation();
    const core = useCore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const login = useCallback(() => {
        if (email.trim().length === 0) {
            setError(t('INVALID_EMAIL'));
            return;
        }
        if (password.length === 0) {
            setError(t('INVALID_PASSWORD'));
            return;
        }
        setError('');
        setBusy(true);
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'Authenticate',
                args: { type: 'Login', email: email.trim(), password },
            },
        });
    }, [email, password, t]);

    useEffect(() => {
        const onCoreError = (source: { event?: string }, coreError?: { message?: string }) => {
            if (source.event !== 'UserAuthenticated') return;
            setBusy(false);
            setError(coreError?.message ?? 'Login failed.');
        };
        core.on('error', onCoreError);
        return () => core.off('error', onCoreError);
    }, []);

    return (
        <div className={classnames(styles['panel'], styles['standard'])}>
            <div className={styles['text']}>
                <h1 className={styles['title']}>{t('LOG_IN')}</h1>
                <p className={styles['message']}>Log in with your Stremio email and password.</p>
            </div>
            <div className={styles['form']}>
                <Field

                    type={'email'}
                    placeholder={t('EMAIL')}
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                />
                <Field

                    type={'password'}
                    placeholder={t('PASSWORD')}
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    onSubmit={login}
                />
                {error ? <div className={styles['error']}>{error}</div> : null}
                <div className={styles['actions']}>
                    <Button focusKey={'intro:login'} className={styles['action']} disabled={busy} onClick={login}>
                        {busy ? t('AUTHENTICATING') : t('LOG_IN')}
                    </Button>
                    <Button focusKey={'intro:code'} className={styles['action']} onClick={onBack}>Log in with a code</Button>
                </div>
            </div>
        </div>
    );
};

const TvIntro = () => {
    const core = useCore();
    const navigate = useNavigate();
    const routeFocused = useRouteFocused();
    const routeActive = useRouteActive();
    const [mode, setMode] = useState<Mode>('code');

    useEffect(() => {
        if (!routeFocused || mode !== 'standard') return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!isBackKey(event)) return;
            // a dialog on top (the text editor) handles its own Back
            if (document.querySelector('.modal-container')) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            setMode('code');
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [routeFocused, mode]);

    useEffect(() => {
        if (!routeActive) return;
        setFocus(mode === 'code' ? 'intro:standard' : 'intro:login');
    }, [routeActive, mode]);

    useEffect(() => {
        const onCoreEvent = (name: string) => {
            if (name === 'UserAuthenticated' && routeFocused) navigate('/');
        };
        core.on('event', onCoreEvent);
        return () => core.off('event', onCoreEvent);
    }, [routeFocused]);

    return (
        <div className={styles['tv-intro']}>
            <img className={styles['logo']} src={require('/assets/images/logo.png')} alt={''} />
            {
                mode === 'code' ?
                    <CodeLogin onStandardLogin={() => setMode('standard')} onGuest={() => navigate('/')} />
                    :
                    <StandardLogin onBack={() => setMode('code')} />
            }
        </div>
    );
};

export default TvIntro;
