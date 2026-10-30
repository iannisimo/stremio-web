import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'stremio/components/Image';
import { FocusContext, useFocusGroup } from 'stremio/services/Navigation';
import useDetailBack from './useDetailBack';
import styles from './TvDetail.less';

export type MetaState = 'none' | 'noAddons' | 'loading' | 'error' | 'ready';

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
    const infoGroup = useFocusGroup<HTMLDivElement>({ focusKey: 'detail-info' });
    const panelGroup = useFocusGroup<HTMLDivElement>({ focusKey: 'detail-panel' });
    useDetailBack(onBack);

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
                        <FocusContext.Provider value={infoGroup.focusKey}>
                            <div ref={infoGroup.ref} className={styles['info']}>
                                {info}
                            </div>
                        </FocusContext.Provider>
                        <FocusContext.Provider value={panelGroup.focusKey}>
                            <div ref={panelGroup.ref} className={styles['panel']}>
                                {panel}
                            </div>
                        </FocusContext.Provider>
                    </>
            }
        </div>
    );
};

export default TvDetail;
