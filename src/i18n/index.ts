import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

export const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  en: {
    translation: en,
  },
};

export const supportedLanguages = [
  { code: 'zh-CN', name: '中文', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
