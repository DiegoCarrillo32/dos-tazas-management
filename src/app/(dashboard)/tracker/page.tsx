'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Clock, FileText } from 'lucide-react'
import { useWorkerTimeLogs, useLogTime, useDeleteTimeLog } from '@/hooks/queries'
import { calculateHoursWorked, buildTimestamp, previewHours } from '@/utils/tracker-logic'
import { GenericModal } from '@/components/ui/GenericModal'
import { StatusBadge } from '@/components/ui/status-badge'
import { useTranslation } from '@/i18n/LanguageProvider'

export default function TrackerPage() {
  const { t } = useTranslation()
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
      setFormError(t('tracker_fill_fields'))
      return
    }

    const startIso = buildTimestamp(date, startTime)
    const endIso = buildTimestamp(date, endTime)

    if (!startIso || !endIso) {
      setFormError(t('tracker_invalid_values'))
      return
    }

    const hours = calculateHoursWorked(startIso, endIso)
    if (hours <= 0) {
      setFormError(t('tracker_end_after_start'))
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
      setFormError(t('tracker_save_failed'))
    }
  }

  const handleDelete = (id: string) => {
    showConfirm(
      t('tracker_delete_title'),
      t('tracker_delete_confirm'),
      async () => {
        try {
          await deleteLogMutation.mutateAsync(id)
        } catch (err) {
          console.error(err)
          showAlert(t('tracker_error'), t('tracker_delete_failed'))
        }
      },
      "destructive"
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('tracker_title')}
        subtitle={t('tracker_subtitle')}
        action={
          <GenericModal
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            hideFooter={true}
            hideTitle={true}
            title={t('tracker_log_hours')}
            contentClassName="sm:max-w-[450px]"
            trigger={
              <Button className="bg-card text-coffee-fruit hover:bg-warm-roast/10 dark:hover:bg-warm-roast/30 border border-coffee-fruit/20 dark:border-border rounded-full px-6 shadow-sm transition-all">
                <Plus className="mr-2 h-4 w-4" /> {t('tracker_log_time')}
              </Button>
            }
          >
            <h2 className="text-xl font-heading text-expresso mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {t('tracker_log_hours')}
            </h2>
            <form onSubmit={handleLogTime} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_date')}</label>
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
                  <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_start')}</label>
                  <input 
                    type="time" 
                    required
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_end')}</label>
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
                      ⏱ {t('tracker_hours_logged').replace('{hours}', previewedHours.toFixed(2))}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {t('tracker_end_after_start')}
                    </p>
                  )}
                </div>
              )}
              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{formError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_notes')}</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none resize-none"
                  placeholder={t('tracker_notes_placeholder')}
                />
              </div>
              <Button
                type="submit"
                disabled={logTimeMutation.isPending || (date && startTime && endTime ? previewedHours <= 0 : false)}
                className="w-full bg-coffee-fruit text-white hover:bg-coffee-fruit/90"
              >
                {logTimeMutation.isPending ? t('tracker_saving') : t('tracker_save')}
              </Button>
            </form>
          </GenericModal>
        }
      />

      <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-hidden">
        <div className="p-4 border-b border-warm-roast/10 dark:border-border bg-white-pergamino dark:bg-muted/30 flex items-center text-expresso/70 dark:text-muted-foreground">
          <FileText className="w-4 h-4 mr-2" />
          <h3 className="font-bold text-sm uppercase tracking-wider">{t('tracker_history')}</h3>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-3 p-4 bg-warm-roast/5 dark:bg-muted/10">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-xl border border-warm-roast/10 dark:border-border animate-pulse" />
            ))
          ) : !timeLogs?.length ? (
            <div className="px-6 py-8 text-center text-expresso/40 dark:text-muted-foreground">{t('tracker_no_logs')}</div>
          ) : (
            timeLogs.map(log => {
              const hours = calculateHoursWorked(log.start_time, log.end_time)
              return (
                <div key={log.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 dark:border-border shadow-sm p-4 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-expresso dark:text-foreground">{new Date(log.start_time).toLocaleDateString()}</div>
                      <div className="text-xs text-expresso/60 dark:text-muted-foreground">
                        {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <StatusBadge tone={log.status === 'paid' ? 'success' : 'warning'}>{log.status}</StatusBadge>
                  </div>
                  <div className="font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} {t('tracker_hours_unit')}</div>
                  {log.notes && <p className="text-xs text-expresso/60 dark:text-muted-foreground bg-warm-roast/5 dark:bg-muted/20 p-2 rounded-lg">{log.notes}</p>}
                  {log.status === 'pending' && (
                    <Button onClick={() => handleDelete(log.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 self-start">
                      {t('delete')}
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>

        <table className="hidden md:table w-full text-sm text-left min-w-[800px]">
          <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino/50 dark:bg-muted/10 border-b border-warm-roast/10 dark:border-border font-bold tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">{t('common_date')}</th>
              <th scope="col" className="px-6 py-4">{t('common_time')}</th>
              <th scope="col" className="px-6 py-4">{t('common_hours')}</th>
              <th scope="col" className="px-6 py-4">{t('common_notes')}</th>
              <th scope="col" className="px-6 py-4">{t('common_status')}</th>
              <th scope="col" className="px-6 py-4 text-right">{t('common_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">{t('loading')}</td></tr>
            ) : !timeLogs?.length ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-expresso/40 dark:text-muted-foreground">{t('tracker_no_logs')}</td></tr>
            ) : (
              timeLogs.map(log => {
                const hours = calculateHoursWorked(log.start_time, log.end_time)
                
                return (
                  <tr key={log.id} className="border-b border-warm-roast/5 dark:border-border/50 hover:bg-warm-roast/5 dark:hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-expresso/80 dark:text-foreground font-medium">{new Date(log.start_time).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground text-sm">
                      {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} {t('tracker_hours_unit')}</td>
                    <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground text-sm max-w-xs truncate">
                      {log.notes || <span className="text-expresso/30 dark:text-muted-foreground/50 italic">{t('tracker_no_notes')}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={log.status === 'paid' ? 'success' : 'warning'}>
                        {log.status}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.status === 'pending' && (
                        <Button 
                          onClick={() => handleDelete(log.id)} 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {t('delete')}
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
