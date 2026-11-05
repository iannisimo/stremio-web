// The episode whose streams were open, so the episode list can go back to it.
// The streams panel replaces the list on the same page, so it can't remember.
let openedEpisodeId: string | null = null;

export const setOpenedEpisode = (id: string) => {
    openedEpisodeId = id;
};

// read once: the next list that opens takes it
export const takeOpenedEpisode = () => {
    const id = openedEpisodeId;
    openedEpisodeId = null;
    return id;
};
