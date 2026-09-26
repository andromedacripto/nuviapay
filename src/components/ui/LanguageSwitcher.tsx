import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'pt', label: 'PT', full: 'Português' },
  { code: 'es', label: 'ES', full: 'Español' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) ?? 'en';

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-0.5">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => void i18n.changeLanguage(lang.code)}
          title={lang.full}
          className={`
            px-2 py-1 rounded-md text-xs font-medium transition-colors
            ${current === lang.code
              ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--subtle)] hover:text-[var(--foreground)]'
            }
          `}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
