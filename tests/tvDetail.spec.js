const {
    groupLinks,
    seasonsOf,
    pickSeason,
    videosForSeason,
    pickInitialVideoId,
    groupStreamsByAddon
} = require('../src/routes/MetaDetails/TvDetail/detailLogic');

describe('tvDetail logic', () => {
    describe('groupLinks', () => {
        it('splits imdb and share from the category groups', () => {
            const result = groupLinks([
                { category: 'Genres', name: 'Action', url: 'stremio:///discover/https%3A%2F%2Fexample.com/movie/top?genre=Action' },
                { category: 'Cast', name: 'Adam', url: 'stremio:///search?search=Adam' },
                { category: 'Writers', name: 'Eve', url: 'stremio:///search?search=Eve' },
                { category: 'imdb', name: '8.7', url: 'https://imdb.com/title/tt1' },
                { category: 'share', name: 'Share', url: 'https://www.strem.io/s/movie/tt1' }
            ]);
            expect(result.imdb.href).toBe('https://imdb.com/title/tt1');
            expect(result.imdb.label).toBe('8.7');
            expect(result.share).not.toBeNull();
            expect(result.groups.map((g) => g.category)).toEqual(['Genres', 'Cast', 'Writers']);
            expect(result.groups[1].items[0].href.startsWith('#/search')).toBe(true);
        });

        it('wraps external links in the warning page', () => {
            const result = groupLinks([{ category: 'Cast', name: 'X', url: 'https://example.com/x' }]);
            expect(result.groups[0].items[0].href).toBe(`https://www.stremio.com/warning#${encodeURIComponent('https://example.com/x')}`);
        });

        it('handles empty input', () => {
            const empty = { imdb: null, share: null, groups: [] };
            expect(groupLinks([])).toEqual(empty);
            expect(groupLinks(undefined)).toEqual(empty);
        });
    });

    describe('seasonsOf', () => {
        it('keeps unique numeric seasons, specials last', () => {
            const videos = [2, 0, 1, 1, null, NaN].map((season) => ({ season }));
            expect(seasonsOf(videos)).toEqual([1, 2, 0]);
        });
    });

    describe('pickSeason', () => {
        const videos = [
            { id: 'a', season: 1 },
            { id: 'b', season: 2 }
        ];
        it('keeps an explicit season that exists', () => {
            expect(pickSeason({ seasons: [1, 2], season: 2, videos, libraryVideoId: undefined })).toBe(2);
        });
        it('falls back to the library video season', () => {
            expect(pickSeason({ seasons: [1, 2], season: 9, videos: [{ id: 'x', season: 2 }, { id: 'y', season: 1 }], libraryVideoId: 'y' })).toBe(1);
        });
        it('falls back to the first non-special season', () => {
            expect(pickSeason({ seasons: [0, 1, 2], season: null, videos, libraryVideoId: undefined })).toBe(1);
        });
        it('uses specials when they are all there is', () => {
            expect(pickSeason({ seasons: [0], season: null, videos: [], libraryVideoId: undefined })).toBe(0);
        });
        it('returns null without seasons', () => {
            expect(pickSeason({ seasons: [], season: null, videos: [], libraryVideoId: undefined })).toBeNull();
        });
    });

    describe('videosForSeason', () => {
        it('returns everything sorted when no season', () => {
            const videos = [{ episode: 3 }, { episode: 1 }, { episode: 2 }];
            expect(videosForSeason(videos, null).map((v) => v.episode)).toEqual([1, 2, 3]);
        });
        it('filters by season', () => {
            const videos = [{ season: 1, episode: 2 }, { season: 2, episode: 1 }, { season: 1, episode: 1 }];
            expect(videosForSeason(videos, 1).map((v) => v.episode)).toEqual([1, 2]);
        });
    });

    describe('pickInitialVideoId', () => {
        const list = [{ id: 'a' }, { id: 'b' }];
        it('prefers the library video', () => {
            expect(pickInitialVideoId({ videosForSeason: list, libraryVideoId: 'b' })).toBe('b');
        });
        it('falls back to the first', () => {
            expect(pickInitialVideoId({ videosForSeason: list, libraryVideoId: 'zzz' })).toBe('a');
        });
        it('returns null when empty', () => {
            expect(pickInitialVideoId({ videosForSeason: [], libraryVideoId: 'a' })).toBeNull();
        });
    });

    describe('groupStreamsByAddon', () => {
        it('keeps only ready add-ons', () => {
            const streams = [
                { addon: { transportUrl: 'ready', manifest: { name: 'R' } }, content: { type: 'Ready', content: [{ name: 's' }] } },
                { addon: { transportUrl: 'loading', manifest: { name: 'L' } }, content: { type: 'Loading' } },
                { addon: { transportUrl: 'err', manifest: { name: 'E' } }, content: { type: 'Err', content: 'x' } }
            ];
            const result = groupStreamsByAddon(streams);
            expect(Object.keys(result)).toEqual(['ready']);
            expect(result.ready.streams).toEqual([{ name: 's' }]);
        });
    });
});
