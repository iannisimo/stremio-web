import React, { forwardRef } from 'react';
import { usePlatform } from 'stremio/common';
import { Scale, MultiselectMenu, Toggle } from 'stremio/components';
import { Section, Option } from '../components';
import useInterfaceOptions from './useInterfaceOptions';
import { REMOTE_NAVIGATION_LABEL } from 'stremio/services/RemoteNavigation';

type Props = {
    profile: Profile,
};

const Interface = forwardRef<HTMLDivElement, Props>(({ profile }: Props, ref) => {
    const { shell } = usePlatform();

    const {
        interfaceLanguageSelect,
        interfaceSize,
        quitOnCloseToggle,
        escExitFullscreenToggle,
        hideSpoilersToggle,
        gamepadSupportToggle,
        remoteNavigationToggle,
    } = useInterfaceOptions(profile);

    return (
        <Section ref={ref} label={'INTERFACE'}>
            <Option label={'SETTINGS_UI_LANGUAGE'}>
                <MultiselectMenu
                    className={'multiselect'}
                    {...interfaceLanguageSelect}
                />
            </Option>
            <Option label={'SETTINGS_UI_ZOOM'}>
                <Scale {...interfaceSize} />
            </Option>
            {
                shell.active &&
                    <Option label={'SETTINGS_QUIT_ON_CLOSE'}>
                        <Toggle
                            tabIndex={-1}
                            {...quitOnCloseToggle}
                        />
                    </Option>
            }
            {
                shell.active &&
                    <Option label={'SETTINGS_FULLSCREEN_EXIT'}>
                        <Toggle
                            tabIndex={-1}
                            {...escExitFullscreenToggle}
                        />
                    </Option>
            }
            <Option label={'SETTINGS_BLUR_UNWATCHED_IMAGE'}>
                <Toggle
                    tabIndex={-1}
                    {...hideSpoilersToggle}
                />
            </Option>
            <Option label={'SETTINGS_GAMEPAD'}>
                <Toggle
                    tabIndex={-1}
                    {...gamepadSupportToggle}
                />
            </Option>
            <Option label={REMOTE_NAVIGATION_LABEL}>
                <Toggle
                    tabIndex={-1}
                    {...remoteNavigationToggle}
                />
            </Option>
        </Section>
    );
});

export default Interface;
