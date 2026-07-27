import { useLayoutEffect } from 'react';

import useLocalStorage from '#hooks/useLocalStorage';
import { defaultConfigValue } from '#utils/constants';
import { getFromStorage } from '#utils/localStorage';
import {
    ConfigStorage,
    Palette,
    ThemeMode,
} from '#utils/types';

const validPalettes: ReadonlySet<Palette> = new Set(['catppuccin', 'gruvbox', 'monokai', 'solarized', 'terracotta']);
const validThemeModes: ReadonlySet<ThemeMode> = new Set(['auto', 'light', 'dark']);

function resolvePalette(value: Palette | undefined, fallback: Palette): Palette {
    return value && validPalettes.has(value) ? value : fallback;
}

function resolveThemeMode(value: ThemeMode | undefined, fallback: ThemeMode): ThemeMode {
    return value && validThemeModes.has(value) ? value : fallback;
}

function resolveEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
}

// eslint-disable-next-line react-refresh/only-export-components
export function bootstrapTheme() {
    const storedConfig = getFromStorage<Partial<ConfigStorage>>('timur-config');
    const themeMode = resolveThemeMode(storedConfig?.themeMode, defaultConfigValue.themeMode);
    document.documentElement.dataset.theme = resolveEffectiveTheme(themeMode);
    document.documentElement.dataset.lightPalette = resolvePalette(
        storedConfig?.lightPalette,
        defaultConfigValue.lightPalette,
    );
    document.documentElement.dataset.darkPalette = resolvePalette(
        storedConfig?.darkPalette,
        defaultConfigValue.darkPalette,
    );
}

interface BaseProps {
    children: React.ReactNode;
}

function ThemeProvider(props: BaseProps) {
    const { children } = props;

    const [config] = useLocalStorage('timur-config');
    const lightPalette = resolvePalette(config.lightPalette, defaultConfigValue.lightPalette);
    const darkPalette = resolvePalette(config.darkPalette, defaultConfigValue.darkPalette);
    const themeMode = resolveThemeMode(config.themeMode, defaultConfigValue.themeMode);

    useLayoutEffect(() => {
        document.documentElement.dataset.lightPalette = lightPalette;
        document.documentElement.dataset.darkPalette = darkPalette;
    }, [lightPalette, darkPalette]);

    useLayoutEffect(() => {
        if (themeMode !== 'auto') {
            document.documentElement.dataset.theme = themeMode;
            return undefined;
        }
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            document.documentElement.dataset.theme = mediaQuery.matches ? 'dark' : 'light';
        };
        apply();
        mediaQuery.addEventListener('change', apply);
        return () => mediaQuery.removeEventListener('change', apply);
    }, [themeMode]);

    return children;
}

export default ThemeProvider;
