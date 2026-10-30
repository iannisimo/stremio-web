import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useToast from 'stremio/common/Toast/useToast';
import usePlayUrl from 'stremio/common/usePlayUrl';
import FullscreenDialog from 'stremio/components/FullscreenDialog';
import TextInput from 'stremio/components/TextInput';
import { useFocusable, setFocus } from 'stremio/services/Navigation';
import styles from './PlayUrlDialog.less';

const INPUT_KEY = 'play-url-input';
const PLAY_KEY = 'play-url-play';

const isPlayable = (text: string) => /^https?:\/\/.+/i.test(text) || /^magnet:\?/i.test(text);

type Props = {
    onClose: () => void,
};

const PlayUrlDialog = ({ onClose }: Props) => {
    const { t } = useTranslation();
    const toast = useToast();
    const { handlePlayUrl } = usePlayUrl();
    const [value, setValue] = useState('');

    // Left/right move the caret; up/down leave the field.
    const { ref: focusRef } = useFocusable<object, HTMLInputElement>({
        focusKey: INPUT_KEY,
        onArrowPress: (direction) => direction === 'up' || direction === 'down',
    });

    // Prefill from the clipboard when it holds something playable.
    useEffect(() => {
        let cancelled = false;
        navigator.clipboard?.readText()
            .then((text) => {
                const trimmed = text.trim();
                if (!cancelled && isPlayable(trimmed)) {
                    setValue(trimmed);
                    setFocus(PLAY_KEY);
                }
            })
            .catch(() => null);
        return () => {
            cancelled = true;
        };
    }, []);

    const play = useCallback(async () => {
        const text = value.trim();
        if (!isPlayable(text)) {
            toast.show({ type: 'error', title: 'Not a valid URL or magnet link.', timeout: 5000 });
            setFocus(INPUT_KEY);
            return;
        }
        if (await handlePlayUrl(text)) onClose();
    }, [value, handlePlayUrl, onClose, toast]);

    const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value), []);

    const actions = useMemo(() => [
        { label: t('PLAYER_PLAY'), focusKey: PLAY_KEY, onClick: play },
        { label: t('BUTTON_CANCEL'), onClick: onClose },
    ], [t, play, onClose]);

    return (
        <FullscreenDialog
            icon={'magnet-link'}
            title={t('PLAY_URL_MAGNET_LINK')}
            message={'Paste an http(s) stream URL or a magnet link.'}
            actions={actions}
            initialFocusKey={INPUT_KEY}
            onClose={onClose}
        >
            <TextInput
                ref={focusRef}
                className={styles['input']}
                value={value}
                placeholder={'https://…  or  magnet:?xt=…'}
                onChange={onChange}
                onSubmit={play}
            />
        </FullscreenDialog>
    );
};

export default PlayUrlDialog;
