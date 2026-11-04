import en from './en';
import hi from './hi';

export const translations = {
  en,
  hi,
};

let currentLanguage = 'en';

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
  }
};

export const getLanguage = () => currentLanguage;

export const t = (path, lang = currentLanguage) => {
  const dict = translations[lang] || translations.en;
  const parts = path.split('.');
  let result = dict;
  for (const part of parts) {
    if (result && result[part] !== undefined) {
      result = result[part];
    } else {
      // Fallback to English
      let fallback = translations.en;
      for (const fPart of parts) {
        if (fallback && fallback[fPart] !== undefined) {
          fallback = fallback[fPart];
        } else {
          return path;
        }
      }
      return fallback;
    }
  }
  return result;
};

export default {
  translations,
  setLanguage,
  getLanguage,
  t,
};

