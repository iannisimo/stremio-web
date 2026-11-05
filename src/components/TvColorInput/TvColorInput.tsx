import React, { useCallback, useMemo, useState } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import TvFullscreenDialog from 'stremio/components/TvFullscreenDialog';
import useBinaryState from 'stremio/common/useBinaryState';
import { FocusButton, FocusGroup } from 'stremio/services/Navigation';
import { Hsla, hexToHsla, hslaToHex, normalizeHex } from './color';
import styles from './TvColorInput.less';

type Props = {
    className: string,
    value: string,
    onChange?: (value: string) => void,
    onClick?: (event: React.MouseEvent) => void,
};

const SWATCHES = [
    '#FFFFFFFF', '#808080FF', '#000000FF', '#00000080', '#00000000', '#FFFF00FF',
    '#FFA500FF', '#FF0000FF', '#00FF00FF', '#00FFFFFF', '#0000FFFF', '#FF00FFFF',
];

// one picker is open at a time
const SWATCHES_FOCUS_KEY = 'color-picker:swatches';
const swatchFocusKey = (index: number) => `${SWATCHES_FOCUS_KEY}:${index}`;

const isTransparent = (value: string) => normalizeHex(value).endsWith('00');

// same as the .checkerboard() mixin in TvColorInput.less, under the opacity track
const CHECKERBOARD = 'repeating-conic-gradient(#8a8a8e 0% 25%, #d8d8dc 0% 50%) 0 0 / 0.5rem 0.5rem';

// painted over the checkerboard, so see-through colors show it
const fill = (color: string) => ({ boxShadow: `inset 0 0 0 10rem ${color}` });

const Swatch = ({ color, selected, onPick, focusKey }: { color: string, selected: boolean, onPick: (color: string) => void, focusKey: string }) => {
    const { t } = useTranslation();
    return (
        <FocusButton
            focusKey={focusKey}
            className={classnames(styles['swatch'], { [styles['selected']]: selected })}
            title={isTransparent(color) ? t('BUTTON_COLOR_TRANSPARENT') : color}
            onClick={() => onPick(color)}
        >
            <span className={styles['swatch-color']} style={fill(color)} />
        </FocusButton>
    );
};

type SliderProps = {
    label: string,
    value: number,
    max: number,
    step: number,
    unit: string,
    // the track, showing what each position gives
    background: string,
    onChange: (value: number) => void,
};

// One focus stop: ← / → change the value, also at the ends.
const Slider = ({ label, value, max, step, unit, background, onChange }: SliderProps) => {
    const onArrowPress = useCallback((direction: string) => {
        if (direction !== 'left' && direction !== 'right') return true;
        const next = Math.min(max, Math.max(0, value + (direction === 'left' ? -step : step)));
        if (next !== value) onChange(next);
        return false;
    }, [value, max, step, onChange]);
    const { ref } = useFocusable<object, HTMLDivElement>({ onArrowPress });

    const onMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        onChange(Math.round(ratio * max));
    }, [max, onChange]);

    return (
        <div ref={ref} className={styles['slider']} tabIndex={-1} role={'slider'} aria-label={label} aria-valuenow={value} aria-valuemax={max}>
            <div className={styles['slider-heading']}>
                <span>{label}</span>
                <span className={styles['slider-value']}>{value}{unit}</span>
            </div>
            <div className={styles['track']} style={{ background }} onMouseDown={onMouseDown}>
                <div className={styles['thumb']} style={{ left: `${(value / max) * 100}%` }} />
            </div>
        </div>
    );
};

type PickerProps = {
    value: string,
    onSelect: (value: string) => void,
    onClose: () => void,
};

const Picker = ({ value, onSelect, onClose }: PickerProps) => {
    const { t } = useTranslation();
    // kept as HSL: a gray has no hue in hex, so the hue slider keeps its place
    const [color, setColor] = useState<Hsla>(() => hexToHsla(value));
    const hex = hslaToHex(color);
    const selectedSwatch = SWATCHES.indexOf(hex);

    const pick = useCallback((swatch: string) => setColor(hexToHsla(swatch)), []);
    const setHue = useCallback((h: number) => setColor((current) => ({ ...current, h })), []);
    const setSaturation = useCallback((s: number) => setColor((current) => ({ ...current, s })), []);
    const setLightness = useCallback((l: number) => setColor((current) => ({ ...current, l })), []);
    const setOpacity = useCallback((opacity: number) => setColor((current) => ({ ...current, a: Math.round((opacity / 100) * 255) })), []);

    const { h, s, l, a } = color;
    const opacity = Math.round((a / 255) * 100);
    const hues = [0, 60, 120, 180, 240, 300, 360].map((hue) => `hsl(${hue}, ${s}%, ${l}%)`).join(', ');

    const actions = useMemo(() => [
        { label: t('SELECT'), onClick: () => onSelect(hex) },
        { label: t('BUTTON_CANCEL'), onClick: onClose },
    ], [t, hex, onSelect, onClose]);

    return (
        <TvFullscreenDialog
            title={t('CHOOSE_COLOR')}
            actions={actions}
            preferredChildFocusKey={SWATCHES_FOCUS_KEY}
            onClose={onClose}
        >
            <div className={styles['picker']}>
                <div className={styles['preview']}>
                    <span className={styles['preview-color']} style={fill(hex)} />
                    <span className={styles['preview-label']}>{isTransparent(hex) ? t('BUTTON_COLOR_TRANSPARENT') : hex}</span>
                </div>
                <FocusGroup
                    className={styles['swatches']}
                    focusKey={SWATCHES_FOCUS_KEY}
                    preferredChildFocusKey={selectedSwatch >= 0 ? swatchFocusKey(selectedSwatch) : undefined}
                >
                    {
                        SWATCHES.map((swatch, index) => (
                            <Swatch key={swatch} focusKey={swatchFocusKey(index)} color={swatch} selected={index === selectedSwatch} onPick={pick} />
                        ))
                    }
                </FocusGroup>
                <Slider label={'Hue'} value={h} max={360} step={5} unit={'°'} background={`linear-gradient(to right, ${hues})`} onChange={setHue} />
                <Slider label={'Saturation'} value={s} max={100} step={5} unit={'%'} background={`linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`} onChange={setSaturation} />
                <Slider label={'Lightness'} value={l} max={100} step={5} unit={'%'} background={`linear-gradient(to right, #000, hsl(${h}, ${s}%, 50%), #fff)`} onChange={setLightness} />
                <Slider label={'Opacity'} value={opacity} max={100} step={5} unit={'%'} background={`linear-gradient(to right, hsla(${h}, ${s}%, ${l}%, 0), hsl(${h}, ${s}%, ${l}%)), ${CHECKERBOARD}`} onChange={setOpacity} />
            </div>
        </TvFullscreenDialog>
    );
};

// Same props as upstream's ColorInput. The picker is a full-screen dialog:
// swatches for the usual subtitle colors, H / S / L and opacity sliders to fine-tune.
const TvColorInput = ({ className, value, onChange, onClick, ...props }: Props) => {
    const { t } = useTranslation();
    const [open, openPicker, closePicker] = useBinaryState(false);

    const onButtonClick = useCallback((event: React.MouseEvent) => {
        onClick?.(event);
        openPicker();
    }, [onClick, openPicker]);

    const select = useCallback((selected: string) => {
        closePicker();
        onChange?.(selected);
    }, [onChange, closePicker]);

    return (
        <React.Fragment>
            <FocusButton
                title={isTransparent(value) ? t('BUTTON_COLOR_TRANSPARENT') : value}
                {...props}
                style={{ backgroundColor: value }}
                className={classnames(className, styles['color-input'])}
                onClick={onButtonClick}
            >
                {
                    isTransparent(value) ?
                        <span className={styles['transparent-label']}>{t('BUTTON_COLOR_TRANSPARENT')}</span>
                        :
                        null
                }
            </FocusButton>
            {
                open ?
                    <Picker value={value} onSelect={select} onClose={closePicker} />
                    :
                    null
            }
        </React.Fragment>
    );
};

export default TvColorInput;
