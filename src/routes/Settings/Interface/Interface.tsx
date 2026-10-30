import React, { forwardRef, useMemo } from 'react';
import { usePlatform } from 'stremio/common';
import { Scale, MultiselectMenu, Toggle } from 'stremio/components';
import { Section, Option } from '../components';
import useFullscreen from 'stremio/common/Fullscreen/useFullscreen';
import { KEEP_FULLSCREEN_LABEL, useKeepFullscreenSetting } from 'stremio/services/KeepFullscreen';
import useInterfaceOptions from './useInterfaceOptions';

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
    } = useInterfaceOptions(profile);

    const [keepFullscreen, setKeepFullscreen] = useKeepFullscreenSetting();
    const [, requestFullscreen, , , fullscreenSupported] = useFullscreen();
    const keepFullscreenToggle = useMemo(() => ({
        checked: keepFullscreen,
        onClick: () => {
            setKeepFullscreen(!keepFullscreen);
            if (!keepFullscreen) requestFullscreen();
        },
    }), [keepFullscreen, setKeepFullscreen, requestFullscreen]);

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
            {
                fullscreenSupported &&
                    <Option label={KEEP_FULLSCREEN_LABEL}>
                        <Toggle
                            tabIndex={-1}
                            {...keepFullscreenToggle}
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
        </Section>
    );
});

export default Interface;
