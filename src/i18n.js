import { createI18n } from 'vue-i18n';
import config from '../sunrise.config';
import en from './en-locales.json'

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  numberFormats: config.formats.number,
  //bug in vue i18n, wrong casing for this prop
  datetimeFormats: config.formats.datetime,
  locale:'en',//todo:need to fix for multiple locale
  messages: {
    en
  }
});

export default i18n;
