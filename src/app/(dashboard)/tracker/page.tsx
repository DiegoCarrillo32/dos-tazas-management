'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Clock, FileText } from 'lucide-react'
import { useWorkerTimeLogs, useLogTime, useDeleteTimeLog } from '@/hooks/queries'
import { calculateHoursWorked, buildTimestamp, previewHours } from '@/utils/tracker-logic'
import { GenericModal } from '@/components/ui/GenericModal'

export default function TrackerPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title?: string
    message?: string
    isConfirm?: boolean
    onConfirm?: () => void
    confirmVariant?: "default" | "destructive"
  }>({ isOpen: false })

  const showAlert = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmVariant: "default" | "destructive" = "default") => {
    setModalState({ isOpen: true, title, message, isConfirm: true, onConfirm, confirmVariant })
  }

  const { data: timeLogs, isLoading } = useWorkerTimeLogs()
  const logTimeMutation = useLogTime()
  const deleteLogMutation = useDeleteTimeLog()

  // Live preview of hours in the form
  const previewedHours = useMemo(
    () => previewHours(date, startTime, endTime),
    [date, startTime, endTime]
  )

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!date || !startTime || !endTime) {
      setFormError('Please fill in all fields.')
      return
    }

    const startIso = buildTimestamp(date, startTime)
    const endIso = buildTimestamp(date, endTime)

    if (!startIso || !endIso) {
      setFormError('Invalid date or time values. Please try again.')
      return
    }

    const hours = calculateHoursWorked(startIso, endIso)
    if (hours <= 0) {
      setFormError('End time must be after start time.')
      return
    }

    try {
      await logTimeMutation.mutateAsync({
        startTime: startIso,
        endTime: endIso,
        notes: notes || null
      })
      setIsOpen(false)
      setDate('')
      setStartTime('')
      setEndTime('')
      setNotes('')
      setFormError('')
    } catch (err) {
      console.error('Failed to log time:', err)
      setFormError('Failed to save. Please try again.')
    }
  }

  const handleDelete = (id: string) => {
    showConfirm(
      "Delete Time Log",
      "Are you sure you want to delete this time log?",
      async () => {
        try {
          await deleteLogMutation.mutateAsync(id)
        } catch (err) {
          console.error(err)
          showAlert("Error", "Failed to delete log")
        }
      },
      "destructive"
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Time Tracker"
        subtitle="Log your hours worked and view your timesheet history."
        action={
          <GenericModal
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            hideFooter={true}
            hideTitle={true}
            title="Log Your Hours"
            contentClassName="sm:max-w-[450px]"
            trigger={
              <Button className="bg-card text-coffee-fruit hover:bg-warm-roast/10 dark:hover:bg-warm-roast/30 border border-coffee-fruit/20 dark:border-border rounded-full px-6 shadow-sm transition-all">
                <Plus className="mr-2 h-4 w-4" /> Log Time
              </Button>
            }
          >
            <h2 className="text-xl font-heading text-expresso mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Log Your Hours
            </h2>
            <form onSubmit={handleLogTime} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-expresso mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-expresso mb-1">Start Time</label>
                  <input 
                    type="time" 
                    required
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-expresso mb-1">End Time</label>
                  <input 
                    type="time" 
                    required
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                    className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none" 
                  />
                </div>
              </div>
              {/* Live hours preview */}
              {date && startTime && endTime && (
                <div className={`p-3 rounded-lg border text-center ${
                  previewedHours > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  {previewedHours > 0 ? (
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      ⏱ {previewedHours.toFixed(2)} hours will be logged
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      End time must be after start time
                    </p>
                  )}
                </div>
              )}
              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{formError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-expresso mb-1">Notes (Optional)</label>
                <textarea 
                  rows={3}
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none resize-none"
                  placeholder="What did you work on?"
                />
              </div>
              <Button 
                type="submit"
                disabled={logTimeMutation.isPending || (date && startTime && endTime ? previewedHours <= 0 : false)}
                className="w-full bg-coffee-fruit text-white hover:bg-coffee-fruit/90"
              >
                {logTimeMutation.isPending ? 'Saving...' : 'Save Time Log'}
              </Button>
            </form>
          </GenericModal>
        }
      />

      <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-x-auto">
        <div className="p-4 border-b border-warm-roast/10 dark:border-border bg-white-pergamino dark:bg-muted/30 flex items-center text-expresso/70 dark:text-muted-foreground">
          <FileText className="w-4 h-4 mr-2" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Timesheet History</h3>
        </div>
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino/50 dark:bg-muted/10 border-b border-warm-roast/10 dark:border-border font-bold tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Time</th>
              <th scope="col" className="px-6 py-4">Hours</th>
              <th scope="col" className="px-6 py-4">Notes</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">Loading...</td></tr>
            ) : !timeLogs?.length ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-expresso/40 dark:text-muted-foreground">No hours logged yet.</td></tr>
            ) : (
              timeLogs.map(log => {
                const hours = calculateHoursWorked(log.start_time, log.end_time)
                
                return (
                  <tr key={log.id} className="border-b border-warm-roast/5 dark:border-border/50 hover:bg-warm-roast/5 dark:hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-expresso/80 dark:text-foreground font-medium">{new Date(log.start_time).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground text-sm">
                      {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} hrs</td>
                    <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground text-sm max-w-xs truncate">
                      {log.notes || <span className="text-expresso/30 dark:text-muted-foreground/50 italic">No notes</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        log.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.status === 'pending' && (
                        <Button 
                          onClick={() => handleDelete(log.id)} 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <GenericModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        onConfirm={modalState.isConfirm ? modalState.onConfirm : undefined}
        confirmVariant={modalState.confirmVariant}
      >
        <p>{modalState.message}</p>
      </GenericModal>
    </div>
  )
}
