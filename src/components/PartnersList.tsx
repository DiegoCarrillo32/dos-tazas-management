'use client'

import { usePartners } from '@/hooks/queries'
import { TableSkeleton } from '@/components/Skeletons'
import { Store } from 'lucide-react'
import type { B2BPartnerRecord } from '@/types'
import { PartnerManagementModal } from '@/components/PartnerManagementModal'

export function PartnersList() {
  const { data: partners, isLoading } = usePartners()

  if (isLoading) {
    return <TableSkeleton cols={5} rows={3} />
  }

  const partnersList = Array.isArray(partners) ? partners : (partners ? [partners] : [])

  if (partnersList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-expresso/50 bg-card rounded-xl border border-warm-roast/10 border-dashed">
        <Store className="h-12 w-12 opacity-20 mb-4" />
        <p className="text-lg font-medium">No partners found</p>
        <p className="text-sm mt-1">Generate an invite code to connect with your first wholesale client.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-semibold tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">Company</th>
              <th scope="col" className="px-6 py-4">Contact</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4">Connected Since</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partnersList.map((partner: B2BPartnerRecord) => (
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    partner.status === 'active' ? 'bg-green-100 text-green-800' :
                    partner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {partner.status}
                  </span>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
