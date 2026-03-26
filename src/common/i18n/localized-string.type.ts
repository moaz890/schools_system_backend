export type LocalizedString = {
    en: string;
    ar: string;
};

export type Lang = 'en' | 'ar';

export function pickLocalizedString(
    value: LocalizedString,
    lang: Lang,
): string {
    return lang === 'ar' ? value.ar : value.en;
}

