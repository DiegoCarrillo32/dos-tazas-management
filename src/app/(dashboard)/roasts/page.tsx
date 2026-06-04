'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Flame, Edit, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RoastBatchForm } from '@/components/RoastBatchForm'
import { useRoastBatches } from '@/hooks/queries'
import { TableRowSkeleton } from '@/components/Skeletons'

export default function RoastsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { data: roasts, isLoading } = useRoastBatches()

  const filteredRoasts = roasts?.filter(r => 
    r.green_lot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Roast Batches"
        subtitle="Manage and log your production roasts."
        action={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-full px-6 shadow-sm shadow-warm-roast/20 transition-all" />
            }>
              <Plus className="mr-2 h-4 w-4" /> Log Roast
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 border-none bg-transparent shadow-none">
              <DialogTitle className="sr-only">Log Roast</DialogTitle>
              <RoastBatchForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-expresso/40" />
            <Input
              placeholder="Search roasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Roasts Table */}
      <div className="bg-white rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-warm-roast/10 animate-pulse" />
            ))
          ) : filteredRoasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-expresso/50">
              <Flame className="h-8 w-8 opacity-20" />
              <p>No roast batches found</p>
            </div>
          ) : (
            filteredRoasts.map((batch) => {
              const yieldPercent = (batch.weight_in_grams && batch.weight_out_grams && batch.weight_in_grams > 0)
                ? ((batch.weight_out_grams / batch.weight_in_grams) * 100).toFixed(1)
                : null
              return (
                <div key={batch.id} className="flex flex-col bg-white rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                    <div>
                      <div className="font-bold text-expresso text-base mb-1">{batch.green_lot_name || 'Unknown Lot'}</div>
                      <span className="text-xs bg-warm-roast/10 text-expresso/70 px-2 py-0.5 rounded-full">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full" />
                        }>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] p-0 border-none bg-transparent shadow-none">
                          <DialogTitle className="sr-only">Edit Roast</DialogTitle>
                          <RoastBatchForm initialData={batch} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                        Weight In
                      </div>
                      <div className="font-medium text-expresso text-sm">
                        {batch.weight_in_grams} g
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                        Weight Out
                      </div>
                      <div className="font-medium text-expresso text-sm">
                        {batch.weight_out_grams} g
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                        Yield
                      </div>
                      <div className="font-medium text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${Number(yieldPercent) < 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {yieldPercent ? `${yieldPercent}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                        Roaster
                      </div>
                      <div className="font-medium text-expresso text-sm truncate" title={batch.equipment_name || ''}>
                        {batch.equipment_name || <span className="text-expresso/40 italic font-normal">—</span>}
                      </div>
                    </div>
                  </div>

                  {(batch.notes || batch.roast_time_minutes) && (
                    <div className="px-4 pb-4">
                      {batch.roast_time_minutes && (
                        <p className="text-xs text-expresso/60 mb-2">
                          <span className="font-semibold text-expresso">Time:</span> {batch.roast_time_minutes} mins
                        </p>
                      )}
                      {batch.notes && (
                        <p className="text-xs text-expresso/60 bg-warm-roast/5 p-2 rounded-lg italic">
                          &quot;{batch.notes}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-semibold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Date / Time</th>
                <th scope="col" className="px-6 py-4">Green Coffee Lot</th>
                <th scope="col" className="px-6 py-4">Roaster</th>
                <th scope="col" className="px-6 py-4">Weight In (g)</th>
                <th scope="col" className="px-6 py-4">Weight Out (g)</th>
                <th scope="col" className="px-6 py-4">Yield (%)</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowSkeleton cols={7} rows={3} />
              ) : filteredRoasts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-expresso/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Flame className="h-8 w-8 opacity-20" />
                      <p>No roast batches found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoasts.map((batch) => {
                  const yieldPercent = (batch.weight_in_grams && batch.weight_out_grams && batch.weight_in_grams > 0)
                    ? ((batch.weight_out_grams / batch.weight_in_grams) * 100).toFixed(1)
                    : null
                  return (
                    <tr key={batch.id} className="bg-white border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-expresso">
                        <div className="flex flex-col">
                          <span>{new Date(batch.created_at).toLocaleDateString()}</span>
                          {batch.roast_time_minutes && (
                            <span className="text-xs text-expresso/50">{batch.roast_time_minutes} mins</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-coffee-fruit">{batch.green_lot_name || 'Unknown Lot'}</span>
                        {batch.notes && <p className="text-xs text-expresso/60 truncate max-w-[200px] mt-1">{batch.notes}</p>}
                      </td>
                      <td className="px-6 py-4 text-expresso/80">
                        {batch.equipment_name || <span className="text-expresso/40">—</span>}
                      </td>
                      <td className="px-6 py-4 font-medium">{batch.weight_in_grams}</td>
                      <td className="px-6 py-4 font-medium">{batch.weight_out_grams}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${Number(yieldPercent) < 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {yieldPercent ? `${yieldPercent}%` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Dialog>
                          <DialogTrigger render={
                            <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full" />
                          }>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] p-0 border-none bg-transparent shadow-none">
                            <DialogTitle className="sr-only">Edit Roast</DialogTitle>
                            <RoastBatchForm initialData={batch} />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
