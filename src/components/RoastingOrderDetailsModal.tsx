'use client'

import { Check, CircleCheckBig, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUpdateRoastingOrderStatus } from '@/hooks/queries'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { RoastingOrderWithPartner, RoastingOrderStatus } from '@/types'
import { defaultRoastingConfig } from '@/config/roastingConfig'
import { toast } from 'sonner'

const crcFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

const statusStyles: Record<RoastingOrderStatus, string> = {
  pending: 'bg-blue-100 text-blue-800',
  accepted: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusKeys: Record<RoastingOrderStatus, DictionaryKey> = {
  pending: 'roasting_status_pending',
  accepted: 'roasting_status_accepted',
  completed: 'roasting_status_completed',
  cancelled: 'roasting_status_cancelled',
}

interface RoastingOrderDetailsModalProps {
  order: RoastingOrderWithPartner
  onClose?: () => void
}

export function RoastingOrderDetailsModal({ order, onClose }: RoastingOrderDetailsModalProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateRoastingOrderStatus()

  const machineName =
    defaultRoastingConfig.machines.find((m) => m.id === order.machine_id)?.name || order.machine_id

  const lineItems = ([
    { key: 'calc_line_labor', value: order.cost_breakdown.labor },
    { key: 'calc_line_energy', value: order.cost_breakdown.energy },
    { key: 'calc_line_green', value: order.cost_breakdown.greenCoffee },
    { key: 'calc_line_packaging', value: order.cost_breakdown.packaging },
    { key: 'calc_line_grinding', value: order.cost_breakdown.grinding },
  ] as { key: DictionaryKey; value: number | null }[]).filter((i) => i.value !== null)

  const config: { key: DictionaryKey; value: DictionaryKey }[] = [
    {
      key: 'calc_green_source_label',
      value: order.green_source === 'WE_PROVIDE' ? 'calc_source_us' : 'calc_source_client',
    },
    {
      key: 'calc_packaging_label',
      value: order.packaging === 'WE_PACKAGE' ? 'calc_packaging_us' : 'calc_packaging_client',
    },
    {
      key: 'calc_grinding_label',
      value: order.grinding === 'WE_GRIND' ? 'calc_grinding_us' : 'calc_grinding_client',
    },
  ]

  const runUpdate = (status: RoastingOrderStatus, successKey: DictionaryKey) =>
    updateMutation.mutate(
      { id: order.id, status },
      {
        onSuccess: () => {
          toast.success(t(successKey))
          onClose?.()
        },
        onError: (err: Error) => toast.error(err.message),
      }
    )

  return (
    <div className="bg-card rounded-2xl shadow-2xl border border-warm-roast/10 p-6 space-y-5 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading text-expresso">{t('roasting_order_details')}</h2>
          <p className="text-expresso/70 font-medium text-sm mt-1">
            {order.b2b_partners?.company_name || t('roasting_unknown_partner')}
          </p>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[order.status]}`}>
          {t(statusKeys[order.status])}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat label={t('calc_summary_green_in')} value={`${(order.green_grams_in / 1000).toFixed(2)} kg`} />
        <Stat label={t('calc_summary_roasted_out')} value={`${(order.roasted_grams_out / 1000).toFixed(2)} kg`} />
        <Stat label={t('calc_machine_used')} value={machineName} />
        <Stat
          label={t('calc_batches')}
          value={`${order.batches_needed} · ${Number(order.hours_required).toFixed(1)} h`}
        />
        {order.bags_needed !== null && (
          <Stat label={t('calc_bags_needed')} value={String(order.bags_needed)} />
        )}
      </div>

      <div className="rounded-xl bg-warm-roast/5 border border-warm-roast/10 p-4 space-y-1">
        {config.map((row) => (
          <div key={row.key} className="flex justify-between text-sm py-1">
            <span className="text-expresso/60">{t(row.key)}</span>
            <span className="font-medium text-expresso">{t(row.value)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-warm-roast/10 pt-4 space-y-1">
        {lineItems.map((item) => (
          <div key={item.key} className="flex justify-between text-sm text-expresso/80 py-1">
            <span>{t(item.key)}</span>
            <span className="font-medium text-expresso">{crcFormatter.format(item.value!)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center rounded-xl bg-coffee-fruit/10 px-4 py-3 mt-2">
          <span className="font-bold text-expresso">{t('calc_total')}</span>
          <span className="text-2xl font-heading text-coffee-fruit">
            {crcFormatter.format(Number(order.total_cost))}
          </span>
        </div>
      </div>

      {order.notes && (
        <p className="text-sm text-expresso/70 bg-warm-roast/5 p-3 rounded-lg italic">&quot;{order.notes}&quot;</p>
      )}

      {(order.status === 'pending' || order.status === 'accepted') && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-warm-roast/10 pt-4">
          <Button
            variant="outline"
            onClick={() => runUpdate('cancelled', 'roasting_order_cancelled')}
            disabled={updateMutation.isPending}
            className="text-red-600 border-red-200 hover:bg-red-50 gap-1 rounded-full"
          >
            <X className="h-4 w-4" /> {t('roasting_action_cancel')}
          </Button>
          {order.status === 'pending' && (
            <Button
              onClick={() => runUpdate('accepted', 'roasting_order_accepted')}
              disabled={updateMutation.isPending}
              className="bg-coffee-fruit hover:bg-warm-roast text-white gap-1 rounded-full px-6"
            >
              <Check className="h-4 w-4" /> {t('roasting_action_accept')}
            </Button>
          )}
          {order.status === 'accepted' && (
            <Button
              onClick={() => runUpdate('completed', 'roasting_order_completed')}
              disabled={updateMutation.isPending}
              className="bg-coffee-fruit hover:bg-warm-roast text-white gap-1 rounded-full px-6"
            >
              <CircleCheckBig className="h-4 w-4" /> {t('roasting_action_complete')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{label}</div>
      <div className="font-medium text-expresso text-sm">{value}</div>
    </div>
  )
}
