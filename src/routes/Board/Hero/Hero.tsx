import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import Icon from '@stremio/stremio-icons/react';
import { Button } from 'stremio/components';
import { FocusContext, useFocusGroup } from 'stremio/services/Navigation';
import styles from './Hero.less';

const SLIDES = 6;
const INTERVAL = 9000;

type Link = { name: string, category: string };

type Item = {
    id: string,
    type: string,
    name: string,
    background?: string | null,
    logo?: string | null,
    description?: string | null,
    releaseInfo?: string | null,
    runtime?: string | null,
    links?: Link[],
    deepLinks?: { metaDetailsStreams?: string, metaDetailsVideos?: string },
};

type Catalog = {
    content?: { type: string, content: Item[] } | null,
};

type Props = {
    catalogs: Catalog[],
};

// Round-robin over the first ready catalogs so the hero mixes rows.
const pickSlides = (catalogs: Catalog[]): Item[] => {
    const lists = catalogs
        .filter((catalog) => catalog.content?.type === 'Ready' && Array.isArray(catalog.content.content))
        .slice(0, 3)
        .map((catalog) => catalog.content!.content.filter((item) => item.background && item.description));
    const slides: Item[] = [];
    for (let i = 0; slides.length < SLIDES && lists.some((list) => i < list.length); i++) {
        for (const list of lists) {
            const item = list[i];
            if (item && slides.length < SLIDES && !slides.some(({ id }) => id === item.id)) {
                slides.push(item);
            }
        }
    }
    return slides;
};

const metaLine = (item: Item, t: TFunction) => {
    const genres = (item.links ?? []).filter(({ category }) => category === 'Genres').slice(0, 2).map(({ name }) => name);
    const imdb = (item.links ?? []).find(({ category }) => category === 'imdb')?.name;
    return [
        t(`TYPE_${item.type}`, { defaultValue: item.type }),
        genres.join(', '),
        item.releaseInfo,
        item.runtime,
        imdb ? `IMDb ${imdb}` : null,
    ].filter((part) => typeof part === 'string' && part.length > 0);
};

const Hero = ({ catalogs }: Props) => {
    const { t } = useTranslation();
    const slides = useMemo(() => pickSlides(catalogs), [catalogs]);
    const [index, setIndex] = useState(0);
    const group = useFocusGroup<HTMLDivElement>({ focusKey: 'hero' });
    const paused = group.hasFocusedChild;

    useEffect(() => {
        if (paused || slides.length < 2) return;
        const timer = setTimeout(() => setIndex((index + 1) % slides.length), INTERVAL);
        return () => clearTimeout(timer);
    }, [index, paused, slides.length]);

    useEffect(() => {
        if (index >= slides.length) setIndex(0);
    }, [slides.length]);

    const onArrowPress = useCallback((direction: string) => {
        if (slides.length < 2) return true;
        if (direction === 'right') {
            setIndex((index + 1) % slides.length);
            return false;
        }
        if (direction === 'left') {
            setIndex((index - 1 + slides.length) % slides.length);
            return false;
        }
        return true;
    }, [index, slides.length]);

    // Entering the hero brings the page back to the top.
    const onFocus = useCallback(() => {
        // after the browser's own scroll-into-view for the focused button
        requestAnimationFrame(() => {
            group.ref.current?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }, []);

    const item = slides[index];
    if (!item) return null;

    const href = item.type === 'series' ?
        item.deepLinks?.metaDetailsVideos ?? item.deepLinks?.metaDetailsStreams
        :
        item.deepLinks?.metaDetailsStreams ?? item.deepLinks?.metaDetailsVideos;

    return (
        <FocusContext.Provider value={group.focusKey}>
            <div ref={group.ref} className={styles['hero']} onFocus={onFocus}>
                {
                    slides.map((slide, slideIndex) => (
                        <div
                            key={slide.id}
                            className={classnames(styles['backdrop'], { [styles['active']]: slideIndex === index })}
                            style={{ backgroundImage: `url('${slide.background}')` }}
                        />
                    ))
                }
                <div className={styles['shade']} />
                <div className={styles['info']}>
                    <div key={item.id} className={styles['text']}>
                        {
                            item.logo ?
                                <img className={styles['logo']} src={item.logo} alt={item.name} />
                                :
                                <h1 className={styles['title']}>{item.name}</h1>
                        }
                        <div className={styles['meta']}>
                            {metaLine(item, t).map((part, partIndex) => <span key={partIndex}>{part}</span>)}
                        </div>
                        <p className={styles['description']}>{item.description}</p>
                    </div>
                    <div className={styles['actions']}>
                        <Button className={classnames(styles['button'], styles['primary'])} href={href} onArrowPress={onArrowPress}>
                            <Icon className={styles['icon']} name={'play'} />
                            <span>{t('PLAYER_PLAY')}</span>
                        </Button>
                    </div>
                </div>
                {
                    slides.length > 1 ?
                        <div className={styles['dots']}>
                            {
                                slides.map((slide, slideIndex) => (
                                    <div
                                        key={slide.id}
                                        className={classnames(styles['dot'], { [styles['active']]: slideIndex === index, [styles['paused']]: paused })}
                                        style={{ animationDuration: `${INTERVAL}ms` }}
                                        onClick={() => setIndex(slideIndex)}
                                    />
                                ))
                            }
                        </div>
                        :
                        null
                }
            </div>
        </FocusContext.Provider>
    );
};

export default Hero;
