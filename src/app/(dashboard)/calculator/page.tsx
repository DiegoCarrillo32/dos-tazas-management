'use client'

import { PageHeader } from '@/components/PageHeader'
import { RoastingCalculator } from '@/components/RoastingCalculator'
import { useTranslation } from '@/i18n/LanguageProvider'

export default function CalculatorPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title={t('calc_title')} subtitle={t('calc_subtitle')} />
      <RoastingCalculator />
    </div>
  )
}
