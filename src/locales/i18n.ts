import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './fr/common.json';
import auth from './fr/auth.json';

i18n.use(initReactI18next).init({
  resources: { fr: { common, auth } },
  lng: 'fr',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
