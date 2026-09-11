import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            uz: { translation: uz },
            ru: { translation: ru },
            en: { translation: en },
        },
        fallbackLng: 'uz',
        supportedLngs: ['uz', 'ru', 'en'],
        load: 'languageOnly',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'cookie', 'navigator'],
            caches: ['localStorage', 'cookie'],
            lookupLocalStorage: 'i18nextLng',
            lookupCookie: 'locale',
        },
    });

i18n.on('languageChanged', (lng) => {
    if (lng) {
        const langCode = lng.split('-')[0];
        if (['uz', 'ru', 'en'].includes(langCode)) {
            document.cookie = `locale=${langCode}; path=/; max-age=31536000; SameSite=Lax`;
        }
    }
});

const initialLng = i18n.language?.split('-')[0];
if (initialLng && ['uz', 'ru', 'en'].includes(initialLng)) {
    document.cookie = `locale=${initialLng}; path=/; max-age=31536000; SameSite=Lax`;
}

export default i18n;
