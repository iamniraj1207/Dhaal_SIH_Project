import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import guTranslation from './locales/gu.json';
import taTranslation from './locales/ta.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  gu: { translation: guTranslation },
  ta: { translation: taTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
