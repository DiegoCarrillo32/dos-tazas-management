'use client'

import { Alert } from 'dos-tazas-design-system'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/LanguageProvider'

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Alert
      tone="danger"
      title={t('common_load_failed')}
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common_retry')}
        </Button>
      }
      className="mb-6"
    />
  )
}
