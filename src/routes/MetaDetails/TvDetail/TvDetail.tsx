import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import Image from 'stremio/components/Image';
import { usePageStartFocus, useInSuspenseFallback } from 'stremio/services/Navigation';
import useDetailBack from './useDetailBack';
import styles from './TvDetail.less';

export type MetaState = 'none' | 'noAddons' | 'loading' | 'error' | 'ready';

// The first row of the panel (stream or episode), where the page starts.
export const FIRST_ROW_FOCUS_KEY = 'detail:first-row';

// The info and panel columns, each back on its last focus stop when re-entered.
const Column = ({ className, children }: { className: string, children: React.ReactNode }) => {
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({ saveLastFocusedChild: true });
    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className={className}>{children}</div>
        </FocusContext.Provider>
    );
};

type Props = {
    meta: { background?: string | null } | null,
    metaState: MetaState,
    info: React.ReactNode,
    panel: React.ReactNode,
    onBack: () => void,
};

const MESSAGES: Record<string, string> = {
    none: 'ERR_NO_META_SELECTED',
    noAddons: 'ERR_NO_ADDONS_FOR_META',
    error: 'ERR_NO_META_FOUND',
};

const TvDetail = ({ meta, metaState, info, panel, onBack }: Props) => {
    const { t } = useTranslation();
    useDetailBack(onBack);
    // the page container, from Route
    const pageFocusKey = useContext(FocusContext);
    const inFallback = useInSuspenseFallback();
    usePageStartFocus({ enabled: !inFallback, startFocusKey: FIRST_ROW_FOCUS_KEY, returnFocusKey: pageFocusKey, fallbackFocusKey: pageFocusKey });

    const background = typeof meta?.background === 'string' && meta.background.length > 0 ? meta.background : null;
    const message = MESSAGES[metaState];

    return (
        <div className={styles['tv-detail']}>
            {
                background ?
                    <Image className={styles['backdrop']} src={background} alt={' '} renderFallback={() => null} />
                    :
                    null
            }
            <div className={styles['shade']} />
            {
                message ?
                    <div className={styles['message']}>
                        <Image className={styles['message-image']} src={require('/assets/images/empty.png')} alt={' '} />
                        <div className={styles['message-label']}>{t(message)}</div>
                    </div>
                    :
                    <>
                        <Column className={styles['info']}>
                            {info}
                        </Column>
                        <Column className={styles['panel']}>
                            {panel}
                        </Column>
                    </>
            }
        </div>
    );
};

export default TvDetail;
