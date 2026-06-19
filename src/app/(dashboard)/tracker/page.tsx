'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Clock, FileText, Pencil, Calendar, CheckCircle2, Coins } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkerTimeLogs, useLogTime, useDeleteTimeLog, useUpdateWorkerTimeLog } from '@/hooks/queries'
import { calculateHoursWorked, buildTimestamp, previewHours, resolveHours } from '@/utils/tracker-logic'
import { GenericModal } from '@/components/ui/GenericModal'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatCard } from '@/components/analytics/StatCard'
import { useTranslation } from '@/i18n/LanguageProvider'
import { TimeLogRecord } from '@/types'

export default function TrackerPage() {
  const { t } = useTranslation()

  // ── Log time form ──────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  // ── Edit pending log form ──────────────────────────────────────
  const [editingLog, setEditingLog] = useState<TimeLogRecord | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editFormError, setEditFormError] = useState('')

  // ── Month filter ───────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  // ── Generic alert/confirm modal ────────────────────────────────
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

  // ── Data ───────────────────────────────────────────────────────
  const { data: timeLogs, isLoading } = useWorkerTimeLogs()
  const logTimeMutation = useLogTime()
  const deleteLogMutation = useDeleteTimeLog()
  const updateLogMutation = useUpdateWorkerTimeLog()

  // ── Derived data ───────────────────────────────────────────────
  const availableMonths = useMemo(() => {
    if (!timeLogs) return []
    const months = new Set<string>()
    timeLogs.forEach(log => {
      const d = new Date(log.start_time)
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    })
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [timeLogs])

  const filteredLogs = useMemo(() => {
    if (!timeLogs) return []
    if (selectedMonth === 'all') return timeLogs
    return timeLogs.filter(log => {
      const d = new Date(log.start_time)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return key === selectedMonth
    })
  }, [timeLogs, selectedMonth])

  const summaryStats = useMemo(() => {
    let pendingHours = 0
    let pendingPay = 0
    let paidPay = 0
    const hasRates = filteredLogs.some(l => (l.rate_snapshot ?? l.team_members?.hourly_rate ?? 0) > 0)
    filteredLogs.forEach(log => {
      const hours = resolveHours(log)
      const rate = log.rate_snapshot ?? log.team_members?.hourly_rate ?? 0
      if (log.status === 'pending') {
        pendingHours += hours
        pendingPay += hours * rate
      } else {
        paidPay += hours * rate
      }
    })
    return { pendingHours, pendingPay, paidPay, hasRates }
  }, [filteredLogs])

  // ── Live preview (log form) ────────────────────────────────────
  const previewedHours = useMemo(
    () => previewHours(date, startTime, endTime),
    [date, startTime, endTime]
  )

  // ── Live preview (edit form) ───────────────────────────────────
  const editPreviewedHours = useMemo(
    () => previewHours(editDate, editStart, editEnd),
    [editDate, editStart, editEnd]
  )

  const formatMonthLabel = (key: string) => {
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  // ── Handlers ───────────────────────────────────────────────────
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
      await logTimeMutation.mutateAsync({ startTime: startIso, endTime: endIso, notes: notes || null })
      setIsOpen(false)
      setDate('')
      setStartTime('')
      setEndTime('')
      setNotes('')
      setFormError('')
    } catch (err) {
      console.error('Failed to log time:', err)
      const msg = err instanceof Error ? err.message : ''
      setFormError(msg.startsWith('OVERLAP') ? t('tracker_overlap_error') : t('tracker_save_failed'))
    }
  }

  const openEdit = (log: TimeLogRecord) => {
    const s = new Date(log.start_time)
    const e = new Date(log.end_time)
    const pad = (n: number) => String(n).padStart(2, '0')
    setEditingLog(log)
    setEditDate(`${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`)
    setEditStart(`${pad(s.getHours())}:${pad(s.getMinutes())}`)
    setEditEnd(`${pad(e.getHours())}:${pad(e.getMinutes())}`)
    setEditNotes(log.notes ?? '')
    setEditFormError('')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return
    setEditFormError('')

    if (!editDate || !editStart || !editEnd) {
      setEditFormError(t('tracker_fill_fields'))
      return
    }

    const startIso = buildTimestamp(editDate, editStart)
    const endIso = buildTimestamp(editDate, editEnd)

    if (!startIso || !endIso) {
      setEditFormError(t('tracker_invalid_values'))
      return
    }

    if (calculateHoursWorked(startIso, endIso) <= 0) {
      setEditFormError(t('tracker_end_after_start'))
      return
    }

    try {
      await updateLogMutation.mutateAsync({
        logId: editingLog.id,
        params: { start_time: startIso, end_time: endIso, notes: editNotes || null },
      })
      setEditingLog(null)
    } catch (err) {
      console.error('Failed to update log:', err)
      const msg = err instanceof Error ? err.message : ''
      setEditFormError(msg.startsWith('OVERLAP') ? t('tracker_overlap_error') : t('tracker_edit_failed'))
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

  // ── Shared time field layout ───────────────────────────────────
  const TimeFields = ({
    dateVal, onDate, startVal, onStart, endVal, onEnd, preview,
  }: {
    dateVal: string; onDate: (v: string) => void
    startVal: string; onStart: (v: string) => void
    endVal: string; onEnd: (v: string) => void
    preview: number
  }) => (
    <>
      <div>
        <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_date')}</label>
        <input
          type="date"
          required
          value={dateVal}
          onChange={e => onDate(e.target.value)}
          className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_start')}</label>
          <input
            type="time"
            required
            value={startVal}
            onChange={e => onStart(e.target.value)}
            className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_end')}</label>
          <input
            type="time"
            required
            value={endVal}
            onChange={e => onEnd(e.target.value)}
            className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none"
          />
        </div>
      </div>
      {dateVal && startVal && endVal && (
        <div className={`p-3 rounded-lg border text-center ${
          preview > 0
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          {preview > 0 ? (
            <p className="text-sm font-bold text-green-700 dark:text-green-400">
              ⏱ {t('tracker_hours_logged').replace('{hours}', preview.toFixed(2))}
            </p>
          ) : (
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {t('tracker_end_after_start')}
            </p>
          )}
        </div>
      )}
    </>
  )

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
              <TimeFields
                dateVal={date} onDate={setDate}
                startVal={startTime} onStart={setStartTime}
                endVal={endTime} onEnd={setEndTime}
                preview={previewedHours}
              />
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

      {/* Summary stats */}
      {filteredLogs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t('tracker_stat_pending_hours')}
            value={`${summaryStats.pendingHours.toFixed(2)} ${t('tracker_hours_unit')}`}
            icon={Clock}
            color="text-coffee-fruit"
          />
          {summaryStats.hasRates && (
            <>
              <StatCard
                title={t('tracker_stat_pending_pay')}
                value={`$${summaryStats.pendingPay.toFixed(2)}`}
                icon={Coins}
                color="text-yellow-600 dark:text-yellow-500"
              />
              <StatCard
                title={t('tracker_stat_paid')}
                value={`$${summaryStats.paidPay.toFixed(2)}`}
                icon={CheckCircle2}
                color="text-green-600 dark:text-green-500"
              />
            </>
          )}
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-hidden">
        {/* History header */}
        <div className="p-4 border-b border-warm-roast/10 dark:border-border bg-white-pergamino dark:bg-muted/30 flex items-center justify-between">
          <div className="flex items-center text-expresso/70 dark:text-muted-foreground">
            <FileText className="w-4 h-4 mr-2" />
            <h3 className="font-bold text-sm uppercase tracking-wider">{t('tracker_history')}</h3>
          </div>
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-expresso/60" />
              <Select value={selectedMonth} onValueChange={v => setSelectedMonth(v || 'all')}>
                <SelectTrigger className="w-[160px] bg-card border-warm-roast/20 dark:border-border h-8 text-xs">
                  <SelectValue placeholder={t('tracker_filter_month')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('tracker_all_time')}</SelectItem>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ── Mobile Card View ── */}
        <div className="md:hidden flex flex-col gap-3 p-4 bg-warm-roast/5 dark:bg-muted/10">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-xl border border-warm-roast/10 dark:border-border animate-pulse" />
            ))
          ) : !filteredLogs.length ? (
            <div className="px-6 py-8 text-center text-expresso/40 dark:text-muted-foreground">{t('tracker_no_logs')}</div>
          ) : (
            filteredLogs.map(log => {
              const hours = resolveHours(log)
              const originalHours = calculateHoursWorked(log.start_time, log.end_time)
              const isAdjusted = log.adjusted_hours != null
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
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} {t('tracker_hours_unit')}</span>
                      {isAdjusted && <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">adj</span>}
                    </div>
                    {isAdjusted && (
                      <span className="text-xs text-expresso/50 dark:text-muted-foreground">
                        {t('tracker_original_hours').replace('{hours}', originalHours.toFixed(2))}
                      </span>
                    )}
                  </div>
                  {log.notes && <p className="text-xs text-expresso/60 dark:text-muted-foreground bg-warm-roast/5 dark:bg-muted/20 p-2 rounded-lg">{log.notes}</p>}
                  {log.adjustment_note && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-1.5">
                      {t('tracker_adjustment_reason')}: {log.adjustment_note}
                    </p>
                  )}
                  {log.status === 'pending' && (
                    <div className="flex gap-2 mt-1">
                      <Button onClick={() => openEdit(log)} size="sm" variant="ghost" className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10 dark:hover:bg-warm-roast/20">
                        <Pencil className="h-3.5 w-3.5 mr-1" /> {t('tracker_edit_log_title')}
                      </Button>
                      <Button onClick={() => handleDelete(log.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                        {t('delete')}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ── Desktop Table View ── */}
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
            ) : !filteredLogs.length ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-expresso/40 dark:text-muted-foreground">{t('tracker_no_logs')}</td></tr>
            ) : (
              filteredLogs.map(log => {
                const hours = resolveHours(log)
                const originalHours = calculateHoursWorked(log.start_time, log.end_time)
                const isAdjusted = log.adjusted_hours != null

                return (
                  <tr key={log.id} className="border-b border-warm-roast/5 dark:border-border/50 hover:bg-warm-roast/5 dark:hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-expresso/80 dark:text-foreground font-medium">{new Date(log.start_time).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground text-sm">
                      {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} {t('tracker_hours_unit')}</span>
                          {isAdjusted && <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">adj</span>}
                        </div>
                        {isAdjusted && (
                          <span className="text-xs text-expresso/50 dark:text-muted-foreground">
                            {t('tracker_original_hours').replace('{hours}', originalHours.toFixed(2))}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground text-sm max-w-xs">
                      <div>{log.notes || <span className="text-expresso/30 dark:text-muted-foreground/50 italic">{t('tracker_no_notes')}</span>}</div>
                      {log.adjustment_note && (
                        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-1.5 mt-1">
                          {t('tracker_adjustment_reason')}: {log.adjustment_note}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={log.status === 'paid' ? 'success' : 'warning'}>
                        {log.status}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => openEdit(log)}
                            size="sm"
                            variant="ghost"
                            className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10 dark:hover:bg-warm-roast/20"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> {t('tracker_edit_log_title')}
                          </Button>
                          <Button
                            onClick={() => handleDelete(log.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            {t('delete')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit log modal */}
      <GenericModal
        isOpen={!!editingLog}
        onOpenChange={(open) => !open && setEditingLog(null)}
        hideFooter={true}
        hideTitle={true}
        title={t('tracker_edit_log_title')}
        contentClassName="sm:max-w-[450px]"
      >
        <h2 className="text-xl font-heading text-expresso mb-4 flex items-center">
          <Pencil className="w-5 h-5 mr-2" />
          {t('tracker_edit_log_title')}
        </h2>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <TimeFields
            dateVal={editDate} onDate={setEditDate}
            startVal={editStart} onStart={setEditStart}
            endVal={editEnd} onEnd={setEditEnd}
            preview={editPreviewedHours}
          />
          {editFormError && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{editFormError}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_notes')}</label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none resize-none"
              placeholder={t('tracker_notes_placeholder')}
            />
          </div>
          <Button
            type="submit"
            disabled={updateLogMutation.isPending || (editDate && editStart && editEnd ? editPreviewedHours <= 0 : false)}
            className="w-full bg-coffee-fruit text-white hover:bg-coffee-fruit/90"
          >
            {updateLogMutation.isPending ? t('tracker_saving') : t('tracker_edit_log_save')}
          </Button>
        </form>
      </GenericModal>

      {/* Generic alert/confirm */}
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
