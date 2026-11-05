import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import useToast from 'stremio/common/Toast/useToast';
import TvNotice from 'stremio/components/TvNotice';
import TvFullscreenDialog from 'stremio/components/TvFullscreenDialog';
import TvPlayUrlDialog from 'stremio/components/TvPlayUrlDialog';
import TvServerUrlDialog from 'stremio/App/TvServerUrlDialog';
import { FocusButton, FocusGroup, usePageStartFocus, useInSuspenseFallback } from 'stremio/services/Navigation';
import LibraryPlaceholder from 'stremio/routes/Library/TvPlaceholder';
import CalendarPlaceholder from 'stremio/routes/Calendar/TvPlaceholder';
import TvAddonsNotice from 'stremio/routes/Addons/TvAddonsNotice';
import TvDetail from 'stremio/routes/MetaDetails/TvDetail';
import TvDetailInfo from 'stremio/routes/MetaDetails/TvDetail/TvDetailInfo';
import TvEpisodesPanel from 'stremio/routes/MetaDetails/TvDetail/TvEpisodesPanel';
import styles from './TvMocks.less';

// Dev-only page (#/mock): components that are hard to reach in the real app,
// with fake data, to check navigation on them. Back closes the open one.

const TvMetaItemActions = require('stremio/components/MetaItem/TvMetaItemActions');

const BACK_KEYS = ['Escape', 'Backspace', 'BrowserBack'];
const SCREEN_FOCUS_KEY = 'mocks:screen';
const itemFocusKey = (id: string) => `mocks:item:${id}`;

const BACKGROUND = 'https://images.metahub.space/background/medium/tt1632701/img';
const LOGO = 'https://images.metahub.space/logo/medium/tt1632701/img';
// a live TV channel from the installed addons
const CHANNEL_HREF = '#/detail/tv/stvp_usUSBA370000104/stvp_usUSBA370000104';
const LOREM = 'A brilliant college dropout talks his way into a job with one of New York\'s best legal closers, without a law degree.';

type MockProps = {
    close: () => void,
    report: (what: string) => void,
};

type Mock = {
    id: string,
    label: string,
    // what the buttons do when it isn't only a report
    note?: string,
    // full page (wrapped in a focus group) rather than a dialog
    page?: boolean,
    // a real page to go to instead of a mock
    href?: string,
    render?: (props: MockProps) => React.ReactNode,
};

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3600 * 1000);

// a channel whose videos are EPG programs, from 2 hours ago to 4.5 hours ahead
const PROGRAMS = ['Morning News', 'Weather Today', 'The Daily Report', 'Live: Press Briefing', 'Market Watch', 'Evening News', 'Late Debate'];
const epgChannelMeta = () => ({
    id: 'mock_epg_channel',
    type: 'tv',
    name: 'Mock EPG channel',
    logo: LOGO,
    background: BACKGROUND,
    description: LOREM,
    links: [{ category: 'Genres', name: 'News', url: 'stremio:///discover' }],
    inLibrary: false,
    watched: false,
    videos: PROGRAMS.map((title, index) => {
        const start = hoursFromNow(index - 2);
        return {
            id: `mock_epg_channel:${index}`,
            title,
            overview: LOREM,
            thumbnail: BACKGROUND,
            released: start,
            startTime: start.toISOString(),
            endTime: hoursFromNow(index - 1).toISOString(),
            watched: false,
        };
    }),
});

const EpgChannelMock = ({ close, report }: MockProps) => {
    const meta = useMemo(epgChannelMeta, []);
    const metaItem = useMemo(() => ({ content: { type: 'Ready', content: meta } }), [meta]);
    return (
        <TvDetail
            meta={meta}
            metaState={'ready'}
            info={
                <TvDetailInfo
                    meta={meta}
                    video={null}
                    ratingInfo={null}
                    onToggleLibrary={() => report('Library')}
                    onToggleWatched={() => report('Watched')}
                />
            }
            panel={
                <TvEpisodesPanel
                    metaItem={metaItem}
                    libraryItem={null}
                    season={null}
                    seasonOnSelect={() => report('Season')}
                    toggleNotifications={() => report('Notifications')}
                />
            }
            onBack={close}
        />
    );
};

const MOCKS: Mock[] = [
    {
        id: 'library-placeholder',
        label: 'Library, logged out',
        page: true,
        render: () => <LibraryPlaceholder />,
    },
    {
        id: 'calendar-placeholder',
        label: 'Calendar, logged out',
        page: true,
        render: () => <CalendarPlaceholder />,
    },
    {
        id: 'addons-notice',
        label: 'Addons notice (for the current login state)',
        page: true,
        render: () => <TvAddonsNotice />,
    },
    {
        id: 'notice',
        label: 'Notice with points, actions and a side',
        page: true,
        render: ({ report }) => (
            <TvNotice
                icon={'person-outline'}
                title={'A notice'}
                message={LOREM}
                points={[
                    { icon: 'cloud-sync', text: 'First point' },
                    { icon: 'cloud-library', text: 'Second point' },
                ]}
                actions={[
                    { label: 'First action', onClick: () => report('First action') },
                    { label: 'Second action', onClick: () => report('Second action') },
                ]}
                side={<div className={styles['side']}>side</div>}
            />
        ),
    },
    {
        id: 'fullscreen-dialog',
        label: 'Full-screen dialog (event style)',
        render: ({ close, report }) => (
            <TvFullscreenDialog
                image={LOGO}
                background={BACKGROUND}
                eyebrow={'Eyebrow'}
                title={'A full-screen dialog'}
                message={LOREM}
                actions={[
                    { label: 'Primary', onClick: () => report('Primary') },
                    { label: 'Secondary', onClick: () => report('Secondary') },
                    { label: 'Close', onClick: close },
                ]}
                onClose={close}
            />
        ),
    },
    {
        id: 'card-actions',
        label: 'Card long press (library options)',
        render: ({ close, report }) => (
            <TvMetaItemActions
                name={'Suits'}
                image={BACKGROUND}
                metaItem={{ id: 'tt1632701', logo: LOGO, background: BACKGROUND, description: LOREM }}
                options={[
                    { label: 'CTX_PLAY', value: 'play' },
                    { label: 'CTX_DETAILS', value: 'details' },
                    { label: 'LIBRARY_RESUME_DISMISS', value: 'dismiss' },
                ]}
                onSelectOption={(value: string) => report(value)}
                onClose={close}
            />
        ),
    },
    {
        id: 'server-url',
        label: 'Streaming server URL from a link',
        render: ({ close, report }) => (
            <TvServerUrlDialog
                url={'http://192.168.1.10:11470/'}
                onConfirm={() => { report('Confirm'); close(); }}
                onCancel={close}
            />
        ),
    },
    {
        id: 'play-url',
        label: 'Play URL',
        note: 'live: Done with a valid link opens the player',
        render: ({ close }) => <TvPlayUrlDialog onClose={close} />,
    },
    {
        id: 'epg-channel-detail',
        label: 'Live TV channel detail, with EPG',
        note: 'mark watched on a program (long press) reaches core',
        page: true,
        render: (props) => <EpgChannelMock {...props} />,
    },
    {
        id: 'channel-detail',
        label: 'Live TV channel detail, no EPG',
        note: 'live: CBS News 24/7',
        href: CHANNEL_HREF,
    },
];

const TvMocks = () => {
    const toast = useToast();
    const inFallback = useInSuspenseFallback();
    const [openId, setOpenId] = useState<string | null>(null);
    const lastId = useRef<string>(MOCKS[0].id);
    const open = MOCKS.find(({ id }) => id === openId) ?? null;

    usePageStartFocus({ enabled: !inFallback, startFocusKey: itemFocusKey(MOCKS[0].id), returnFocusKey: itemFocusKey(MOCKS[0].id), fallbackFocusKey: itemFocusKey(MOCKS[0].id) });

    const close = useCallback(() => setOpenId(null), []);
    const report = useCallback((what: string) => {
        toast.show({ type: 'info', title: `Pressed: ${what}`, timeout: 2000 });
    }, [toast]);

    // back on the list (or on the mock that just closed)
    useEffect(() => {
        if (open === null) {
            setFocus(itemFocusKey(lastId.current));
        } else if (open.page) {
            setFocus(SCREEN_FOCUS_KEY);
        }
    }, [open]);

    // Back the mock itself didn't handle closes it
    useEffect(() => {
        if (open === null) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!BACK_KEYS.includes(event.key) || event.defaultPrevented || event.repeat) return;
            if (event.target instanceof HTMLElement && event.target.matches('input, textarea, [data-text-entry]')) return;
            event.preventDefault();
            close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, close]);

    if (open !== null) {
        const content = open.render?.({ close, report }) ?? null;
        return open.page ?
            <FocusGroup className={styles['screen']} focusKey={SCREEN_FOCUS_KEY}>{content}</FocusGroup>
            :
            <div className={styles['screen']}>{content}</div>;
    }

    return (
        <div className={styles['mocks']}>
            <div className={styles['title']}>Mock screens</div>
            <div className={styles['hint']}>Back closes the open one.</div>
            <div className={styles['list']}>
                {
                    MOCKS.map(({ id, label, note, href }) => (
                        <FocusButton
                            key={id}
                            className={styles['item']}
                            focusKey={itemFocusKey(id)}
                            href={href}
                            onClick={() => {
                                lastId.current = id;
                                if (!href) setOpenId(id);
                            }}
                        >
                            <div className={styles['label']}>{label}</div>
                            {note ? <div className={styles['note']}>{note}</div> : null}
                        </FocusButton>
                    ))
                }
            </div>
        </div>
    );
};

export default TvMocks;
