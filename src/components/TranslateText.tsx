'use client'

import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'

export function TranslateText({ tKey, className }: { tKey: DictionaryKey, className?: string }) {
  const { t } = useTranslation()
  if (className) {
    return <span className={className}>{t(tKey)}</span>
  }
  return <>{t(tKey)}</>
}
