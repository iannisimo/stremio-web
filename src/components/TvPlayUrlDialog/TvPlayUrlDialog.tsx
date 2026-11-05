import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useToast from 'stremio/common/Toast/useToast';
import usePlayUrl from 'stremio/common/usePlayUrl';
import { TvTextEditor } from 'stremio/components/TvTextInput';

const isPlayable = (text: string) => /^https?:\/\/.+/i.test(text) || /^magnet:\?/i.test(text);

// how long to wait for the clipboard before opening without it
const CLIPBOARD_TIMEOUT = 500;

type Props = {
    onClose: () => void,
};

// The text editor on its own: Done plays the link, a bad one keeps it open.
const TvPlayUrlDialog = ({ onClose }: Props) => {
    const { t } = useTranslation();
    const toast = useToast();
    const { handlePlayUrl } = usePlayUrl();
    // prefilled from the clipboard when it holds something playable
    const [prefill, setPrefill] = useState<string | null>(null);

    useEffect(() => {
        let done = false;
        const settle = (text: string) => {
            if (done) return;
            done = true;
            setPrefill(text);
        };
        const timer = setTimeout(() => settle(''), CLIPBOARD_TIMEOUT);
        navigator.clipboard?.readText()
            .then((text) => settle(isPlayable(text.trim()) ? text.trim() : ''))
            .catch(() => settle(''));
        return () => {
            done = true;
            clearTimeout(timer);
        };
    }, []);

    const play = useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
        const text = event.currentTarget.value.trim();
        if (!isPlayable(text)) {
            toast.show({ type: 'error', title: 'Not a valid URL or magnet link.', timeout: 5000 });
            return;
        }
        if (await handlePlayUrl(text)) onClose();
    }, [handlePlayUrl, onClose, toast]);

    // Done runs the play check first; only Cancel and Back close right away
    const onEditorClose = useCallback((after?: () => void) => {
        if (after) after();
        else onClose();
    }, [onClose]);

    const inputProps = useMemo(() => ({
        type: 'text',
        placeholder: 'https://…  or  magnet:?xt=…',
        defaultValue: prefill ?? '',
        onSubmit: play,
    }), [prefill, play]);

    if (prefill === null) return null;

    return (
        <TvTextEditor
            title={t('PLAY_URL_MAGNET_LINK')}
            inputProps={inputProps}
            startOnDone={prefill.length > 0}
            onClose={onEditorClose}
        />
    );
};

export default TvPlayUrlDialog;
