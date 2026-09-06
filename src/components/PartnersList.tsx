'use client'

import { usePartners } from '@/hooks/queries'
import { TableRowSkeleton } from '@/components/Skeletons'
import { Store, Phone } from 'lucide-react'
import type { B2BPartnerRecord, PartnerStatus } from '@/types'
import { PartnerManagementModal } from '@/components/PartnerManagementModal'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
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

  return (
    <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
          ))
        ) : (
          partnersList.map((partner: B2BPartnerRecord) => (
            <div key={partner.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="bg-warm-roast/10 p-2 rounded-lg text-warm-roast shrink-0">
                    <Store className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-coffee-fruit truncate">{partner.company_name}</div>
                    <div className="text-xs text-expresso/60 mt-0.5 truncate">
                      {partner.contact_name || '—'}
                    </div>
                  </div>
                </div>
                <StatusBadge tone={STATUS_TONE[partner.status]}>
                  {statusLabel(partner.status)}
                </StatusBadge>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  {partner.contact_phone ? (
                    <a
                      href={`tel:${partner.contact_phone}`}
                      className="inline-flex items-center gap-1.5 text-coffee-fruit hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {partner.contact_phone}
                    </a>
                  ) : (
                    <span className="text-expresso/40">—</span>
                  )}
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50">
                      {t('partners_col_since')}
                    </div>
                    <div className="text-xs text-expresso/70">
                      {new Date(partner.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <PartnerManagementModal partner={partner} fullWidthTrigger />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">{t('common_company')}</th>
              <th scope="col" className="px-6 py-4">{t('partners_col_contact')}</th>
              <th scope="col" className="px-6 py-4">{t('common_status')}</th>
              <th scope="col" className="px-6 py-4">{t('partners_col_since')}</th>
              <th scope="col" className="px-6 py-4 text-right">{t('common_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableRowSkeleton cols={5} rows={3} />
            ) : (
              partnersList.map((partner: B2BPartnerRecord) => (
                <tr key={partner.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                  <td className="px-6 py-4 font-bold text-coffee-fruit">
                    <div className="flex items-center gap-3">
                      <div className="bg-warm-roast/10 p-2 rounded-lg text-warm-roast group-hover:bg-coffee-fruit group-hover:text-white transition-colors">
                        <Store className="h-4 w-4" />
                      </div>
                      {partner.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-expresso">
                    {partner.contact_name || '—'}
                    <div className="text-xs font-normal text-expresso/60 mt-0.5">{partner.contact_phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge tone={STATUS_TONE[partner.status]}>
                      {statusLabel(partner.status)}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-expresso/70">
                    {new Date(partner.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <PartnerManagementModal partner={partner} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
