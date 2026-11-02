import { useCallback, useEffect, useState } from 'react';
import { useCore } from 'stremio/core';

// Same flow as the Android TV app: show a code, approve it at link.stremio.com,
// then log in with the auth key it hands back.
const LINK_API = 'https://link.stremio.com/api/v2';
const POLL_INTERVAL = 3000;
// The API doesn't say when a code expires, so get a fresh one now and then.
const CODE_LIFETIME = 5 * 60 * 1000;

export type LinkCode = {
    code: string,
    link: string,
    qrcode: string,
};

export type LinkStatus = 'loading' | 'waiting' | 'signing-in' | 'error';

const createCode = async (): Promise<LinkCode> => {
    const response = await fetch(`${LINK_API}/create?type=Create`);
    const { result } = await response.json();
    if (!result?.code) throw new Error('No link code in response');
    return result;
};

// Errors until the code is approved.
const readAuthKey = async (code: string): Promise<string | null> => {
    const response = await fetch(`${LINK_API}/read?type=Read&code=${encodeURIComponent(code)}`);
    const { result } = await response.json();
    return typeof result?.authKey === 'string' ? result.authKey : null;
};

const useLinkCode = (active: boolean) => {
    const core = useCore();
    const [linkCode, setLinkCode] = useState<LinkCode | null>(null);
    const [status, setStatus] = useState<LinkStatus>('loading');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!active) return;
        let cancelled = false;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const createdAt = Date.now();

        const poll = (code: string) => {
            timeout = setTimeout(async () => {
                if (cancelled) return;
                if (Date.now() - createdAt > CODE_LIFETIME) {
                    setAttempt((value) => value + 1);
                    return;
                }
                const authKey = await readAuthKey(code).catch(() => null);
                if (cancelled) return;
                if (!authKey) {
                    poll(code);
                    return;
                }
                setStatus('signing-in');
                core.transport.dispatch({
                    action: 'Ctx',
                    args: {
                        action: 'Authenticate',
                        args: { type: 'LoginWithToken', token: authKey },
                    },
                });
            }, POLL_INTERVAL);
        };

        setStatus('loading');
        createCode()
            .then((result) => {
                if (cancelled) return;
                setLinkCode(result);
                setStatus('waiting');
                poll(result.code);
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [active, attempt]);

    useEffect(() => {
        const onCoreError = (source: { event?: string }) => {
            if (source.event === 'UserAuthenticated') {
                setStatus((value) => value === 'signing-in' ? 'error' : value);
            }
        };
        core.on('error', onCoreError);
        return () => core.off('error', onCoreError);
    }, []);

    const refresh = useCallback(() => setAttempt((value) => value + 1), []);

    return { linkCode, status, refresh };
};

export default useLinkCode;
