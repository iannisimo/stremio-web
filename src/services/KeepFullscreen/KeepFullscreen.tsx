import { useEffect } from 'react';
import useFullscreen from 'stremio/common/Fullscreen/useFullscreen';
import { useKeepFullscreenSetting } from './keepFullscreenSetting';

// With the setting on, any key press or click while windowed goes back to
// fullscreen. The event itself still goes through.
const KeepFullscreen = () => {
    const [enabled] = useKeepFullscreenSetting();
    const [fullscreen, requestFullscreen, , , supported] = useFullscreen();

    useEffect(() => {
        if (!enabled || fullscreen || !supported) return;
        const onInput = () => {
            requestFullscreen();
        };
        window.addEventListener('keydown', onInput, true);
        window.addEventListener('pointerdown', onInput, true);
        return () => {
            window.removeEventListener('keydown', onInput, true);
            window.removeEventListener('pointerdown', onInput, true);
        };
    }, [enabled, fullscreen, supported, requestFullscreen]);

    return null;
};

export default KeepFullscreen;
