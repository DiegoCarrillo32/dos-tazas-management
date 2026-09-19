'use client'

import { usePartners } from '@/hooks/queries'
import { Store, Phone } from 'lucide-react'
import type { B2BPartnerRecord, PartnerStatus } from '@/types'
import { PartnerManagementModal } from '@/components/PartnerManagementModal'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'

const STATUS_TONE: Record<PartnerStatus, StatusTone> = {
  active: 'success',
  pending: 'warning',
  revoked: 'danger',
}

export function PartnersList() {
  const { t } = useTranslation()
  const { data: partners, isLoading } = usePartners()

  const partnersList = Array.isArray(partners) ? partners : (partners ? [partners] : [])

  const statusLabel = (status: PartnerStatus) =>
    t(`b2b_status_${status}` as DictionaryKey)

  if (!isLoading && partnersList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-expresso/50 bg-card rounded-xl border border-warm-roast/10 border-dashed text-center">
        <Store className="h-12 w-12 opacity-20 mb-4" />
        <p className="text-lg font-medium">{t('partners_no_found')}</p>
        <p className="text-sm mt-1">{t('partners_no_found_desc')}</p>
      </div>
    )
  }

  const columns: ResponsiveListColumn<B2BPartnerRecord>[] = [
    {
      id: 'company',
      role: 'title',
      header: t('common_company'),
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="bg-warm-roast/10 p-2 rounded-lg text-warm-roast group-hover:bg-coffee-fruit group-hover:text-white transition-colors">
            <Store className="h-4 w-4" />
          </div>
          <span className="font-bold text-coffee-fruit">{p.company_name}</span>
        </div>
      ),
      cardCell: (p) => p.company_name,
    },
    {
      id: 'contact',
      header: t('partners_col_contact'),
      cell: (p) => (
        <>
          <span className="font-medium text-expresso">{p.contact_name || '—'}</span>
          <div className="text-xs font-normal text-expresso/60 mt-0.5">{p.contact_phone}</div>
        </>
      ),
      cardCell: (p) =>
        p.contact_phone ? (
          <a
            href={`tel:${p.contact_phone}`}
            className="inline-flex items-center gap-1.5 text-coffee-fruit hover:underline"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {p.contact_phone}
          </a>
        ) : (
          <span className="text-expresso/40">{p.contact_name || '—'}</span>
        ),
    },
    {
      id: 'status',
      header: t('common_status'),
      cell: (p) => <StatusBadge tone={STATUS_TONE[p.status]}>{statusLabel(p.status)}</StatusBadge>,
    },
    {
      id: 'since',
      header: t('partners_col_since'),
      cell: (p) => (
        <span className="text-expresso/70">{new Date(p.created_at).toLocaleDateString()}</span>
      ),
    },
  ]

  return (
    <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
      <ResponsiveList
        data={partnersList}
        columns={columns}
        rowKey={(p) => p.id}
        actions={(p) => <PartnerManagementModal partner={p} />}
        actionsHeader={t('common_actions')}
        isLoading={isLoading}
        caption={t('common_company')}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-2">
            <Store className="h-8 w-8 opacity-20" />
            <p>{t('partners_no_found')}</p>
          </div>
        }
      />
    </div>
  )
}
