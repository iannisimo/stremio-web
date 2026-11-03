// Copyright (C) 2017-2023 Smart code 203358507

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import throttle from 'lodash.throttle';
import { useProfile, useStreamingServer, useRouteFocused, withCoreSuspender } from 'stremio/common';
import { MainNavBars } from 'stremio/components';
import { SECTIONS } from './constants';
import TvPane from './TvPane';
import Menu from './TvMenu'; // HTPC fork: two-pane section list, upstream './Menu'
import General from './General';
import Interface from './Interface';
import Player from './Player';
import Streaming from './Streaming';
import Info from './Info';
import styles from './Settings.less';

const Settings = () => {
    const routeFocused = useRouteFocused();
    const profile = useProfile();
    const streamingServer = useStreamingServer();

    const sectionsContainerRef = useRef<HTMLDivElement>(null);
    const generalSectionRef = useRef<HTMLDivElement>(null);
    const interfaceSectionRef = useRef<HTMLDivElement>(null);
    const playerSectionRef = useRef<HTMLDivElement>(null);
    const streamingServerSectionRef = useRef<HTMLDivElement>(null);

    const sections = useMemo(() => ([
        { ref: generalSectionRef, id: SECTIONS.GENERAL },
        { ref: interfaceSectionRef, id: SECTIONS.INTERFACE },
        { ref: playerSectionRef, id: SECTIONS.PLAYER },
        { ref: streamingServerSectionRef, id: SECTIONS.STREAMING },
    ]), []);

    const [selectedSectionId, setSelectedSectionId] = useState(SECTIONS.GENERAL);

    const updateSelectedSectionId = useCallback(() => {
        const container = sectionsContainerRef.current;
        if (!container) return;

        const availableSections = sections.filter((section) => section.ref.current);
        if (!availableSections.length) return;

        const { scrollTop, clientHeight, scrollHeight, offsetTop } = container;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isAtBottom) {
            setSelectedSectionId(availableSections[availableSections.length - 1].id);
            return;
        }

        const marker = scrollTop + 50;
        const activeSection = availableSections.reduce((current, section) => {
            const sectionTop = section.ref.current!.offsetTop + offsetTop;
            return sectionTop <= marker ? section : current;
        }, availableSections[0]);

        setSelectedSectionId(activeSection.id);
    }, [sections]);

    // HTPC fork: one section at a time, the menu switches it
    const onMenuSelect = useCallback((event: React.SyntheticEvent<HTMLDivElement>) => {
        const section = sections.find((section) => {
            return section.id === event.currentTarget.dataset.section;
        });

        if (section) {
            setSelectedSectionId(section.id);
            sectionsContainerRef.current?.scrollTo({ top: 0 });
        }
    }, [sections]);

    const onContainerScroll = useCallback(throttle(() => {
        updateSelectedSectionId();
    }, 50), []);

    useLayoutEffect(() => {
        if (routeFocused) {
            updateSelectedSectionId();
        }
    }, [routeFocused]);

    return (
        <MainNavBars className={styles['settings-container']} route={'settings'}>
            <div className={classnames(styles['settings-content'], 'animation-fade-in')}>
                <Menu
                    selected={selectedSectionId}
                    streamingServer={streamingServer}
                    onSelect={onMenuSelect}
                />

                <TvPane ref={sectionsContainerRef} className={styles['sections-container']} onScroll={onContainerScroll}>
                    {
                        selectedSectionId === SECTIONS.GENERAL && <General
                            ref={generalSectionRef}
                            profile={profile}
                        />
                    }
                    {
                        selectedSectionId === SECTIONS.INTERFACE && <Interface
                            ref={interfaceSectionRef}
                            profile={profile}
                        />
                    }
                    {
                        selectedSectionId === SECTIONS.PLAYER && <Player
                            ref={playerSectionRef}
                            profile={profile}
                        />
                    }
                    {
                        selectedSectionId === SECTIONS.STREAMING && <Streaming
                            ref={streamingServerSectionRef}
                            profile={profile}
                            streamingServer={streamingServer}
                        />
                    }
                    {
                        selectedSectionId === SECTIONS.GENERAL && <Info streamingServer={streamingServer} />
                    }
                </TvPane>
            </div>
        </MainNavBars>
    );
};

const SettingsFallback = () => (
    <MainNavBars className={styles['settings-container']} route={'settings'} />
);

export default withCoreSuspender(Settings, SettingsFallback);
