'use client';

import { Language } from '@/lib/storage';

interface LanguageSelectorProps {
  selectedLanguages: Language[];
  onLanguageToggle: (language: Language) => void;
}

export default function LanguageSelector({
  selectedLanguages,
  onLanguageToggle,
}: LanguageSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onLanguageToggle('en')}
        className={`px-3 py-2 rounded text-sm font-medium transition ${
          selectedLanguages.includes('en')
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        English
      </button>
      <button
        onClick={() => onLanguageToggle('zh')}
        className={`px-3 py-2 rounded text-sm font-medium transition ${
          selectedLanguages.includes('zh')
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        中文
      </button>
    </div>
  );
}
