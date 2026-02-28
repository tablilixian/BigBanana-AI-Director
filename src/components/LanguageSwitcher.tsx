import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { supportedLanguages } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-[var(--text-tertiary)]" />
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className="bg-transparent text-xs text-[var(--text-tertiary)] border-none focus:outline-none cursor-pointer"
        title={t('language.switch')}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-[var(--bg-primary)]">
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
