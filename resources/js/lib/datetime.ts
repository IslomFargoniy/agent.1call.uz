import i18n from '@/i18n';

/**
 * Get user's local timezone resolved from browser.
 * Defaults to 'Asia/Tashkent' if not available or unsupported.
 */
export function getUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent';
    } catch {
        return 'Asia/Tashkent';
    }
}

/**
 * Get active locale code suitable for Intl.DateTimeFormat (e.g. 'uz-UZ', 'ru-RU', 'en-US')
 */
export function getActiveLocale(customLocale?: string): string {
    if (customLocale) return customLocale;
    const lang = i18n.language?.split('-')[0] || 'uz';
    switch (lang) {
        case 'ru':
            return 'ru-RU';
        case 'en':
            return 'en-US';
        case 'uz':
        default:
            return 'uz-UZ';
    }
}

/**
 * Parses any incoming timestamp (ISO string with or without Z, unix timestamp in seconds or ms, SQL timestamp)
 * ensuring it is treated as UTC (0 timezone).
 */
export function parseUtcDate(value: string | number | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'number') {
        // Unix timestamp in seconds vs milliseconds
        return new Date(value < 10000000000 ? value * 1000 : value);
    }
    let s = String(value).trim();
    if (!s) return null;

    // Handle "YYYY-MM-DD HH:mm:ss" SQL format by turning into ISO UTC format "YYYY-MM-DDTHH:mm:ssZ"
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
        s = s.replace(' ', 'T') + 'Z';
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        // Date only, e.g. "2026-09-12"
        s = s + 'T00:00:00Z';
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a UTC date string/timestamp into user's local date and time.
 * Example: "12.09.2026, 15:30:45"
 */
export function formatDateTime(
    value: string | number | Date | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    locale?: string
): string {
    const d = parseUtcDate(value);
    if (!d) return '—';

    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: getUserTimezone(),
        ...options,
    };

    try {
        return new Intl.DateTimeFormat(getActiveLocale(locale), defaultOptions).format(d);
    } catch {
        return d.toLocaleString();
    }
}

/**
 * Formats a UTC date string/timestamp into user's local date.
 * Example: "12.09.2026"
 */
export function formatDate(
    value: string | number | Date | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    locale?: string
): string {
    const d = parseUtcDate(value);
    if (!d) return '—';

    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: getUserTimezone(),
        ...options,
    };

    try {
        return new Intl.DateTimeFormat(getActiveLocale(locale), defaultOptions).format(d);
    } catch {
        return d.toLocaleDateString();
    }
}

/**
 * Formats a UTC date string/timestamp into user's local time only.
 * Example: "15:30" or "15:30:45"
 */
export function formatTime(
    value: string | number | Date | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    locale?: string
): string {
    const d = parseUtcDate(value);
    if (!d) return '—';

    const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: getUserTimezone(),
        ...options,
    };

    try {
        return new Intl.DateTimeFormat(getActiveLocale(locale), defaultOptions).format(d);
    } catch {
        return d.toLocaleTimeString();
    }
}

/**
 * Formats log timestamp with time and short date.
 * Example: "15:30:45 12 sent."
 */
export function formatLogTime(value: string | number | Date | null | undefined): string {
    const d = parseUtcDate(value);
    if (!d) return '—';

    try {
        const timePart = formatTime(d, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const datePart = formatDate(d, { day: '2-digit', month: 'short' });
        return ;
    } catch {
        return formatDateTime(d);
    }
}
