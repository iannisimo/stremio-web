// Pure helpers for the TV detail page. Kept as CommonJS so Jest loads them as is.

const UrlUtils = require('url');
const CONSTANTS = require('../../../common/CONSTANTS');
const routesRegexp = require('../../../common/routesRegexp');

const ALLOWED_LINK_REDIRECTS = [
    routesRegexp.search.regexp,
    routesRegexp.discover.regexp,
    routesRegexp.metadetails.regexp
];

/** @typedef {{ label: string, href: string }} Link */

// Same rules as MetaPreview, but Writers stay in.
/**
 * @param {{ category: string, name: string, url: string }[] | undefined} links
 * @returns {{ imdb: Link | null, share: Link | null, groups: { category: string, items: Link[] }[] }}
 */
const groupLinks = (links) => {
    /** @type {Map<string, Link[]>} */
    const groups = new Map();
    /** @type {Link | null} */
    let imdb = null;
    /** @type {Link | null} */
    let share = null;
    if (Array.isArray(links)) {
        links
            .filter((link) => link && typeof link.category === 'string' && typeof link.url === 'string')
            .forEach(({ category, name, url }) => {
                const { protocol, path, pathname, hostname } = UrlUtils.parse(url);
                if (category === CONSTANTS.IMDB_LINK_CATEGORY) {
                    if (hostname === 'imdb.com') {
                        imdb = { label: name, href: url };
                    }
                } else if (category === CONSTANTS.SHARE_LINK_CATEGORY) {
                    share = { label: name, href: url };
                } else if (protocol === 'stremio:') {
                    if (pathname !== null && ALLOWED_LINK_REDIRECTS.some((regexp) => pathname.match(regexp))) {
                        if (!groups.has(category)) groups.set(category, []);
                        groups.get(category).push({ label: name, href: `#${path}` });
                    }
                } else if (typeof hostname === 'string' && hostname.length > 0) {
                    if (!groups.has(category)) groups.set(category, []);
                    groups.get(category).push({
                        label: name,
                        href: `https://www.stremio.com/warning#${encodeURIComponent(url)}`
                    });
                }
            });
    }

    return {
        imdb,
        share,
        groups: Array.from(groups, ([category, items]) => ({ category, items }))
    };
};

const seasonsOf = (videos) => {
    return (Array.isArray(videos) ? videos : [])
        .map(({ season }) => season)
        .filter((season, index, seasons) => {
            return season !== null &&
                typeof season === 'number' &&
                !isNaN(season) &&
                seasons.indexOf(season) === index;
        })
        .sort((a, b) => (a || Number.MAX_SAFE_INTEGER) - (b || Number.MAX_SAFE_INTEGER));
};

const pickSeason = ({ seasons, season, videos, libraryVideoId }) => {
    if (seasons.includes(season)) {
        return season;
    }

    const video = videos?.find((video) => video.id === libraryVideoId);
    if (video && video.season && seasons.includes(video.season)) {
        return video.season;
    }

    const nonSpecial = seasons.filter((season) => season !== 0);
    if (nonSpecial.length > 0) {
        return nonSpecial[0];
    }

    return seasons.length > 0 ? seasons[0] : null;
};

const videosForSeason = (videos, season) => {
    return videos
        .filter((video) => season === null || video.season === season)
        .sort((a, b) => a.episode - b.episode);
};

const pickInitialVideoId = ({ videosForSeason, libraryVideoId }) => {
    if (videosForSeason.some((video) => video.id === libraryVideoId)) {
        return libraryVideoId;
    }

    return videosForSeason.length > 0 ? videosForSeason[0].id : null;
};

const groupStreamsByAddon = (streams) => {
    return streams
        .filter((streams) => streams.content.type === 'Ready')
        .reduce((byAddon, streams) => {
            byAddon[streams.addon.transportUrl] = {
                addon: streams.addon,
                streams: streams.content.content
            };

            return byAddon;
        }, {});
};

module.exports = {
    groupLinks,
    seasonsOf,
    pickSeason,
    videosForSeason,
    pickInitialVideoId,
    groupStreamsByAddon
};
