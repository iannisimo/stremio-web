import { useMemo } from 'react';
import { useCore } from 'stremio/core';
import useProfile from 'stremio/common/useProfile';
import { groupStreamsByAddon } from './detailLogic';

// groupStreamsByAddon plus the click handling StreamsList does
const useStreamsByAddon = (streams: any[]) => {
    const core = useCore();
    const profile = useProfile();
    const playerType = profile.settings.playerType;

    return useMemo(() => {
        const byAddon = groupStreamsByAddon(streams);
        return Object.fromEntries(Object.entries(byAddon).map(([transportUrl, { addon, streams }]: [string, any]) => [
            transportUrl,
            {
                addon,
                streams: streams.map((stream: any) => ({
                    ...stream,
                    onClick: () => {
                        core.transport.analytics({
                            event: 'StreamClicked',
                            args: { stream }
                        });
                        if (playerType !== null) {
                            core.transport.dispatch({
                                action: 'MetaDetails',
                                args: {
                                    action: 'ExternalPlayerStreamOpened',
                                    args: stream
                                }
                            });
                        }
                    },
                    addonName: addon.manifest.name
                }))
            }
        ]));
    }, [streams, playerType]);
};

export default useStreamsByAddon;
