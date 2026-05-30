'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Leaf } from 'lucide-react'
import { useGreenCoffeeLots } from '@/hooks/queries'
import { GreenCoffeeLotForm } from './GreenCoffeeLotForm'

interface GreenCoffeeLotsDialogProps {
  inventoryId: string
  inventoryName: string
}

export function GreenCoffeeLotsDialog({ inventoryId, inventoryName }: GreenCoffeeLotsDialogProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const { data: lots, isLoading } = useGreenCoffeeLots(inventoryId)

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        setIsAdding(false)
        setEditingId(null)
      }
    }}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="text-warm-roast hover:text-coffee-fruit hover:bg-warm-roast/10 h-8 px-2 gap-1 rounded-full" />
      }>
        <Leaf className="h-4 w-4" />
        <span className="text-xs font-semibold">Lots</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white-pergamino dark:bg-card border-warm-roast/20">
        <DialogTitle className="text-xl font-heading text-expresso border-b border-warm-roast/10 pb-4 flex items-center justify-between">
          <span>Lots: {inventoryName}</span>
          {!isAdding && !editingId && (
            <Button size="sm" onClick={() => setIsAdding(true)} className="bg-coffee-fruit hover:bg-warm-roast text-white h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Lot Data
            </Button>
          )}
        </DialogTitle>

        <div className="py-2">
          {isAdding ? (
            <div className="bg-white rounded-lg border border-warm-roast/10 p-4">
              <GreenCoffeeLotForm 
                inventoryId={inventoryId} 
                onCancel={() => setIsAdding(false)} 
                onSuccess={() => setIsAdding(false)} 
              />
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {isLoading ? (
                <p className="text-sm text-expresso/60">Loading lots...</p>
              ) : !lots || lots.length === 0 ? (
                <p className="text-sm text-expresso/60 text-center py-8">No lot details found for this green coffee inventory.</p>
              ) : (
                lots.map(lot => (
                  <div key={lot.id} className="bg-white rounded-lg border border-warm-roast/10 p-4 flex flex-col gap-2">
                    {editingId === lot.id ? (
                      <GreenCoffeeLotForm 
                        inventoryId={inventoryId} 
                        initialData={lot}
                        onCancel={() => setEditingId(null)} 
                        onSuccess={() => setEditingId(null)} 
                      />
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-expresso text-sm">{lot.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(lot.id)} className="h-6 w-6 p-0 text-expresso/50 hover:text-warm-roast">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-expresso/80 mt-2">
                          <div><span className="font-semibold text-expresso/60">Origin:</span> {lot.origin || '-'}</div>
                          <div><span className="font-semibold text-expresso/60">Varietal:</span> {lot.varietal || '-'}</div>
                          <div><span className="font-semibold text-expresso/60">Process:</span> <span className="capitalize">{lot.process || '-'}</span></div>
                          <div><span className="font-semibold text-expresso/60">Altitude:</span> {lot.altitude || '-'}</div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
