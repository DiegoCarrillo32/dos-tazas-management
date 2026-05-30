'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Wrench, Plus, Edit } from 'lucide-react'
import { useMaintenanceLogs } from '@/hooks/queries'
import { MaintenanceLogForm } from './MaintenanceLogForm'

interface MaintenanceLogsDialogProps {
  equipmentId: string
  equipmentName: string
}

export function MaintenanceLogsDialog({ equipmentId, equipmentName }: MaintenanceLogsDialogProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const { data: logs, isLoading } = useMaintenanceLogs(equipmentId)

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
        <Wrench className="h-4 w-4" />
        <span className="text-xs font-semibold">Logs</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white-pergamino dark:bg-card border-warm-roast/20">
        <DialogTitle className="text-xl font-heading text-expresso border-b border-warm-roast/10 pb-4 flex items-center justify-between">
          <span>Maintenance Logs: {equipmentName}</span>
          {!isAdding && !editingId && (
            <Button size="sm" onClick={() => setIsAdding(true)} className="bg-coffee-fruit hover:bg-warm-roast text-white h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Log
            </Button>
          )}
        </DialogTitle>

        <div className="py-2">
          {isAdding ? (
            <div className="bg-white rounded-lg border border-warm-roast/10 p-4">
              <MaintenanceLogForm 
                equipmentId={equipmentId} 
                onCancel={() => setIsAdding(false)} 
                onSuccess={() => setIsAdding(false)} 
              />
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {isLoading ? (
                <p className="text-sm text-expresso/60">Loading logs...</p>
              ) : !logs || logs.length === 0 ? (
                <p className="text-sm text-expresso/60 text-center py-8">No maintenance logs found for this equipment.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="bg-white rounded-lg border border-warm-roast/10 p-4 flex flex-col gap-2">
                    {editingId === log.id ? (
                      <MaintenanceLogForm 
                        equipmentId={equipmentId} 
                        initialData={log}
                        onCancel={() => setEditingId(null)} 
                        onSuccess={() => setEditingId(null)} 
                      />
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-expresso text-sm capitalize">{log.maintenance_type.replace('_', ' ')}</span>
                            <span className="text-xs text-expresso/50">{log.date}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(log.id)} className="h-6 w-6 p-0 text-expresso/50 hover:text-warm-roast">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-expresso/80">{log.description}</p>
                        {log.cost && <p className="text-xs font-semibold text-warm-roast mt-1">Cost: ${log.cost}</p>}
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
