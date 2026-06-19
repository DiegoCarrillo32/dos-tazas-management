'use client'

import { useState, useMemo, useSyncExternalStore } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Users, Clock, Check, Copy, Pencil, Calendar, CheckSquare, Trash2, RotateCcw, Download } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, CheckCircle2, Wallet, Coins, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTeamMembers, useTeamTimeLogs, useGenerateTeamInvite, useUpdateTeamMember, useMarkTimeLogsPaid, useDeleteTeamMember, useSettings, useUpdateTimeLogHours, useAddTimeLogForWorker, useDeleteTimeLog, useRevertTimeLogToPending } from '@/hooks/queries'
import { calculateHoursWorked, calculateTotalPay, resolveHours, buildTimestamp, previewHours } from '@/utils/tracker-logic'
import { useTranslation } from '@/i18n/LanguageProvider'
import { TeamMemberRecord, TeamMemberStatus, TimeLogRecord } from '@/types'
import { StatCard } from '@/components/analytics/StatCard'
import { SortableStatCard } from '@/components/analytics/SortableStatCard'
import { GenericModal } from '@/components/ui/GenericModal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'

export default function TeamPage() {
  const { t } = useTranslation()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteRate, setInviteRate] = useState<string>('15')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  
  const { data: teamMembers, isLoading: loadingTeam } = useTeamMembers()
  const { data: timeLogs, isLoading: loadingLogs } = useTeamTimeLogs()
  const { data: settings } = useSettings()
  
  const generateInviteMutation = useGenerateTeamInvite()
  const updateMemberMutation = useUpdateTeamMember()
  const markPaidMutation = useMarkTimeLogsPaid()
  const deleteMemberMutation = useDeleteTeamMember()
  const updateHoursMutation = useUpdateTimeLogHours()

  const addLogMutation = useAddTimeLogForWorker()
  const deleteLogMutation = useDeleteTimeLog()
  const revertLogMutation = useRevertTimeLogToPending()

  const [editingLog, setEditingLog] = useState<TimeLogRecord | null>(null)
  const [editHoursValue, setEditHoursValue] = useState<string>('')
  const [editAdjustmentNote, setEditAdjustmentNote] = useState<string>('')

  // Add log on behalf of worker
  const [isAddLogOpen, setIsAddLogOpen] = useState(false)
  const [addLogWorkerId, setAddLogWorkerId] = useState<string>('')
  const [addLogDate, setAddLogDate] = useState('')
  const [addLogStart, setAddLogStart] = useState('')
  const [addLogEnd, setAddLogEnd] = useState('')
  const [addLogNotes, setAddLogNotes] = useState('')
  const [addLogFormError, setAddLogFormError] = useState('')

  const currencySymbol = settings?.currency_symbol || '$'

  const [managingMember, setManagingMember] = useState<TeamMemberRecord | null>(null)
  const [managedRate, setManagedRate] = useState<string>('')
  const [managedStatus, setManagedStatus] = useState<TeamMemberStatus>('pending')

  // UI State
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())

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

  // DND State
  const DEFAULT_CARD_ORDER = ['total_payroll', 'pending_pay', 'paid_history']
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CARD_ORDER
    try {
      const saved = window.localStorage.getItem('dos_tazas_team_stats_order')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_CARD_ORDER.length) {
          return parsed
        }
      }
    } catch { }
    return DEFAULT_CARD_ORDER
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  // Hydration-safe mounted flag: false on the server and during the first
  // client render, true afterwards — without calling setState in an effect.
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        localStorage.setItem('dos_tazas_team_stats_order', JSON.stringify(newOrder))
        return newOrder
      })
    }
    setActiveId(null)
  }

  const handleDragCancel = () => setActiveId(null)

  const handleGenerateInvite = async () => {
    if (!inviteName.trim()) {
      showAlert("Validation Error", "Please enter a name for the worker.")
      return
    }
    try {
      const data = await generateInviteMutation.mutateAsync({ name: inviteName.trim(), hourlyRate: Number(inviteRate) })
      setInviteCode(data.invite_code)
    } catch (err) {
      console.error(err)
      showAlert("Error", "Failed to generate invite")
    }
  }

  const handleCopyCode = (code: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${code}` : code
    navigator.clipboard.writeText(url)
    showAlert("Success", "Invite URL copied to clipboard!")
  }

  const handleMarkPaid = async (logId: string) => {
    try {
      await markPaidMutation.mutateAsync([logId])
      setSelectedLogIds(prev => {
        const next = new Set(prev)
        next.delete(logId)
        return next
      })
    } catch (err) {
      console.error(err)
      showAlert("Error", "Failed to mark as paid")
    }
  }
  
  const handleBatchMarkPaid = async () => {
    if (selectedLogIds.size === 0) return
    try {
      await markPaidMutation.mutateAsync(Array.from(selectedLogIds))
      setSelectedLogIds(new Set())
    } catch (err) {
      console.error(err)
      showAlert("Error", "Failed to mark batch as paid")
    }
  }
  
  const openManageModal = (member: TeamMemberRecord) => {
    setManagingMember(member)
    setManagedRate(String(member.hourly_rate))
    setManagedStatus(member.status)
  }

  const handleUpdateMember = async () => {
    if (!managingMember) return
    try {
      await updateMemberMutation.mutateAsync({
        id: managingMember.id,
        params: {
          hourly_rate: Number(managedRate),
          status: managedStatus
        }
      })
      setManagingMember(null)
    } catch (err) {
      console.error(err)
      showAlert("Error", "Failed to update worker")
    }
  }

  const handleDeleteMember = () => {
    if (!managingMember) return
    showConfirm(
      "Delete Worker",
      "Are you sure you want to delete this worker? Their past time logs will remain but they won't be able to log new ones.",
      async () => {
        try {
          await deleteMemberMutation.mutateAsync(managingMember.id)
          setManagingMember(null)
        } catch (err) {
          console.error(err)
          showAlert("Error", "Failed to delete worker")
        }
      },
      "destructive"
    )
  }

  const openEditHours = (log: TimeLogRecord) => {
    setEditingLog(log)
    setEditHoursValue(log.adjusted_hours != null ? String(log.adjusted_hours) : '')
    setEditAdjustmentNote(log.adjustment_note ?? '')
  }

  const handleSaveAdjustedHours = async () => {
    if (!editingLog) return
    const parsed = editHoursValue.trim() === '' ? null : parseFloat(editHoursValue)
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
      showAlert("Error", "Please enter a valid number of hours.")
      return
    }
    try {
      await updateHoursMutation.mutateAsync({
        logId: editingLog.id,
        adjustedHours: parsed,
        adjustmentNote: editAdjustmentNote.trim() || null,
      })
      setEditingLog(null)
    } catch (err) {
      console.error(err)
      showAlert("Error", "Failed to update hours.")
    }
  }

  const addLogPreviewedHours = useMemo(
    () => previewHours(addLogDate, addLogStart, addLogEnd),
    [addLogDate, addLogStart, addLogEnd]
  )

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLogFormError('')
    if (!addLogWorkerId || !addLogDate || !addLogStart || !addLogEnd) {
      setAddLogFormError(t('tracker_fill_fields'))
      return
    }
    const startIso = buildTimestamp(addLogDate, addLogStart)
    const endIso = buildTimestamp(addLogDate, addLogEnd)
    if (!startIso || !endIso || calculateHoursWorked(startIso, endIso) <= 0) {
      setAddLogFormError(t('tracker_end_after_start'))
      return
    }
    try {
      await addLogMutation.mutateAsync({
        workerId: addLogWorkerId,
        startTime: startIso,
        endTime: endIso,
        notes: addLogNotes || null,
      })
      setIsAddLogOpen(false)
      setAddLogWorkerId('')
      setAddLogDate('')
      setAddLogStart('')
      setAddLogEnd('')
      setAddLogNotes('')
    } catch (err) {
      console.error(err)
      setAddLogFormError(t('tracker_save_failed'))
    }
  }

  const handleDeleteLog = (logId: string) => {
    showConfirm(
      t('tracker_delete_title'),
      t('tracker_delete_confirm'),
      async () => {
        try {
          await deleteLogMutation.mutateAsync(logId)
          setSelectedLogIds(prev => { const n = new Set(prev); n.delete(logId); return n })
        } catch (err) {
          console.error(err)
          showAlert(t('tracker_error'), t('tracker_delete_failed'))
        }
      },
      'destructive'
    )
  }

  const handleRevertLog = (logId: string) => {
    showConfirm(
      t('team_revert_to_pending'),
      t('team_revert_confirm'),
      async () => {
        try {
          await revertLogMutation.mutateAsync(logId)
        } catch (err) {
          console.error(err)
          showAlert(t('tracker_error'), 'Failed to revert log.')
        }
      }
    )
  }

  const handleExportCsv = () => {
    const rows = [
      ['Worker', 'Date', 'Start', 'End', 'Hours', 'Rate', 'Pay', 'Status', 'Notes', 'Adj Note'],
      ...filteredLogs.map(log => {
        const hours = resolveHours(log)
        const rate = log.rate_snapshot ?? log.team_members?.hourly_rate ?? 0
        const pay = (hours * rate).toFixed(2)
        const s = new Date(log.start_time)
        const e = new Date(log.end_time)
        return [
          log.team_members?.name || log.team_members?.invite_code || '',
          s.toLocaleDateString(),
          s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hours.toFixed(2),
          rate.toFixed(2),
          pay,
          log.status,
          (log.notes || '').replace(/,/g, ';'),
          (log.adjustment_note || '').replace(/,/g, ';'),
        ]
      })
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheets-${selectedMonth === 'all' ? 'all' : selectedMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const availableMonths = useMemo(() => {
    if (!timeLogs) return []
    const months = new Set<string>()
    timeLogs.forEach(log => {
      const d = new Date(log.start_time)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.add(key)
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

  const pendingLogs = filteredLogs.filter(log => log.status === 'pending')
  const paidLogs = filteredLogs.filter(log => log.status === 'paid')

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedLogIds.size === pendingLogs.length && pendingLogs.length > 0) {
      setSelectedLogIds(new Set())
    } else {
      setSelectedLogIds(new Set(pendingLogs.map(l => l.id)))
    }
  }

  // Calculate statistics per worker
  const workerStats = useMemo(() => {
    return teamMembers?.map(member => {
      const memberLogs = filteredLogs.filter(log => log.team_members?.invite_code === member.invite_code)
      
      let totalHours = 0
      let totalPaid = 0
      let totalPending = 0

      memberLogs.forEach(log => {
        const hours = resolveHours(log)
        totalHours += hours
        const rate = log.rate_snapshot ?? log.team_members?.hourly_rate ?? 0
        const pay = calculateTotalPay(hours, rate)
        if (log.status === 'paid') {
          totalPaid += pay
        } else {
          totalPending += pay
        }
      })

      return {
        id: member.id,
        name: member.name || member.invite_code,
        totalHours,
        totalPaid,
        totalPending,
        totalEarnings: totalPaid + totalPending
      }
    }) || []
  }, [teamMembers, filteredLogs])

  const totalPayroll = workerStats.reduce((acc, curr) => acc + curr.totalEarnings, 0)
  const totalPendingPayroll = workerStats.reduce((acc, curr) => acc + curr.totalPending, 0)

  const cardsConfig = {
    total_payroll: {
      id: 'total_payroll',
      title: 'Total Payroll',
      value: `${currencySymbol}${totalPayroll.toFixed(2)}`,
      icon: DollarSign,
      color: "text-coffee-fruit",
      className: "col-span-1"
    },
    pending_pay: {
      id: 'pending_pay',
      title: 'Pending Pay',
      value: `${currencySymbol}${totalPendingPayroll.toFixed(2)}`,
      icon: Coins,
      color: "text-yellow-600 dark:text-yellow-500",
      className: "col-span-1"
    },
    paid_history: {
      id: 'paid_history',
      title: 'Paid History',
      value: `${currencySymbol}${(totalPayroll - totalPendingPayroll).toFixed(2)}`,
      icon: Wallet,
      color: "text-green-600 dark:text-green-500",
      className: "col-span-1"
    }
  }

  const formatMonthLabel = (key: string) => {
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Team & Workers"
        subtitle="Manage your employees, set hourly rates, and review timesheets."
        action={
          <>
          <GenericModal 
            isOpen={isInviteOpen} 
            onOpenChange={(open) => {
              setIsInviteOpen(open)
              if (!open) setInviteCode(null)
            }}
            hideFooter={true}
            hideTitle={true}
            title="Invite New Worker"
            contentClassName="sm:max-w-[400px]"
            trigger={
              <Button className="bg-card text-coffee-fruit hover:bg-warm-roast/10 dark:hover:bg-warm-roast/30 border border-coffee-fruit/20 dark:border-border rounded-full px-6 shadow-sm transition-all">
                <Plus className="mr-2 h-4 w-4" /> Invite Worker
              </Button>
            }
          >
            <h2 className="text-xl font-heading text-expresso mb-4">Invite New Worker</h2>
            {!inviteCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-expresso mb-1">Worker Name</label>
                  <input 
                    type="text" 
                    value={inviteName} 
                    onChange={e => setInviteName(e.target.value)} 
                    placeholder="e.g. John Doe"
                    className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-expresso mb-1">Hourly Rate ({currencySymbol})</label>
                  <input 
                    type="number" 
                    value={inviteRate} 
                    onChange={e => setInviteRate(e.target.value)} 
                    className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none" 
                  />
                </div>
                <Button 
                  onClick={handleGenerateInvite} 
                  disabled={generateInviteMutation.isPending}
                  className="w-full bg-coffee-fruit text-white hover:bg-coffee-fruit/90"
                >
                  {generateInviteMutation.isPending ? 'Generating...' : 'Generate Invite Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-sm text-expresso/70">Share this link with your worker to let them join your team.</p>
                <div className="p-4 bg-white-pergamino dark:bg-muted/30 border border-warm-roast/20 dark:border-border rounded-xl text-lg font-mono font-bold tracking-wider text-expresso dark:text-foreground break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/join?code=${inviteCode}` : inviteCode}
                </div>
                <Button onClick={() => handleCopyCode(inviteCode)} variant="outline" className="w-full">
                  <Copy className="h-4 w-4 mr-2" /> Copy Invite Link
                </Button>
              </div>
            )}
          </GenericModal>
          <GenericModal 
            isOpen={!!managingMember} 
            onOpenChange={(open) => !open && setManagingMember(null)}
            hideFooter={true}
            hideTitle={true}
            title="Manage Worker"
            contentClassName="sm:max-w-[400px]"
          >
            <h2 className="text-xl font-heading text-expresso mb-4">Manage Worker</h2>
            {managingMember && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-expresso mb-1">Status</label>
                  <select 
                    value={managedStatus} 
                    onChange={e => setManagedStatus(e.target.value as TeamMemberStatus)}
                    className="w-full p-2 border border-warm-roast/20 dark:border-border rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none bg-card"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-expresso mb-1">Hourly Rate ({currencySymbol})</label>
                  <input 
                    type="number" 
                    value={managedRate} 
                    onChange={e => setManagedRate(e.target.value)} 
                    className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none" 
                  />
                </div>
                
                {managingMember.status === 'pending' && (
                  <div className="pt-2 border-t border-warm-roast/10">
                    <label className="block text-sm font-medium text-expresso mb-1">Invite URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={typeof window !== 'undefined' ? `${window.location.origin}/join?code=${managingMember.invite_code}` : managingMember.invite_code}
                        className="flex-1 p-2 text-sm border border-warm-roast/20 dark:border-border rounded-lg bg-white-pergamino dark:bg-muted/30 text-expresso/70 dark:text-muted-foreground outline-none" 
                      />
                      <Button onClick={() => handleCopyCode(managingMember.invite_code)} variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-2">
                  <Button 
                    onClick={handleUpdateMember} 
                    disabled={updateMemberMutation.isPending}
                    className="flex-1 bg-coffee-fruit text-white hover:bg-coffee-fruit/90"
                  >
                    {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    onClick={handleDeleteMember}
                    disabled={deleteMemberMutation.isPending}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </GenericModal>
          </>
        }
      />

      <Tabs defaultValue="roster" className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TabsList className="bg-card border border-warm-roast/10 dark:border-border rounded-xl p-1 h-auto flex flex-row gap-1 w-full overflow-x-auto no-scrollbar sm:w-auto">
          <TabsTrigger value="roster" className="whitespace-nowrap rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:dark:bg-primary/20 data-[state=active]:text-coffee-fruit data-[state=active]:dark:text-primary text-expresso/70 dark:text-muted-foreground transition-all py-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 shrink-0 inline" /> Roster
          </TabsTrigger>
          <TabsTrigger value="pending" className="whitespace-nowrap rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:dark:bg-primary/20 data-[state=active]:text-coffee-fruit data-[state=active]:dark:text-primary text-expresso/70 dark:text-muted-foreground transition-all py-2 text-xs sm:text-sm">
            <Clock className="w-4 h-4 mr-1 shrink-0 inline" /> Pending
            {pendingLogs.length > 0 && (
              <span className="ml-2 bg-coffee-fruit text-white text-[10px] px-1.5 py-0.5 rounded-full inline-block">
                {pendingLogs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid" className="whitespace-nowrap rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:dark:bg-primary/20 data-[state=active]:text-coffee-fruit data-[state=active]:dark:text-primary text-expresso/70 dark:text-muted-foreground transition-all py-2 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 mr-1 shrink-0 inline" /> Paid History
          </TabsTrigger>
          <TabsTrigger value="statistics" className="whitespace-nowrap rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:dark:bg-primary/20 data-[state=active]:text-coffee-fruit data-[state=active]:dark:text-primary text-expresso/70 dark:text-muted-foreground transition-all py-2 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-1 shrink-0 inline" /> Statistics
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-expresso/60" />
          <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val || 'all')}>
            <SelectTrigger className="w-[180px] bg-card border-warm-roast/20 dark:border-border h-9 text-sm">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {availableMonths.map(m => (
                <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="border-warm-roast/20 text-expresso/70 hover:bg-warm-roast/10 h-9"
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" />
            {t('team_export_csv')}
          </Button>
        </div>
      </div>

        <TabsContent value="roster" className="m-0 animate-in fade-in duration-300">
          <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Invite Code</th>
                  <th scope="col" className="px-6 py-4">Worker ID</th>
                  <th scope="col" className="px-6 py-4">Hourly Rate</th>
                  <th scope="col" className="px-6 py-4 text-right">{t('team_pending_hrs')}</th>
                  <th scope="col" className="px-6 py-4 text-right">{t('team_pending_pay')}</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingTeam ? (
                  <tr><td colSpan={8} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">Loading...</td></tr>
                ) : !teamMembers?.length ? (
                  <tr><td colSpan={8} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">No team members found</td></tr>
                ) : (
                  teamMembers.map(member => {
                    const stats = workerStats.find(s => s.id === member.id)
                    const memberPendingLogs = filteredLogs.filter(log => log.status === 'pending' && log.team_members?.invite_code === member.invite_code)
                    const pendingHrs = memberPendingLogs.reduce((acc, log) => acc + resolveHours(log), 0)
                    return (
                    <tr key={member.id} className="border-b border-warm-roast/5 dark:border-border/50 hover:bg-warm-roast/5 dark:hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-expresso dark:text-foreground">{member.name || '—'}</td>
                      <td className="px-6 py-4 font-mono text-expresso/70 dark:text-muted-foreground">{member.invite_code}</td>
                      <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground">{member.worker_user_id ? 'Joined' : 'Pending'}</td>
                      <td className="px-6 py-4 font-medium text-expresso dark:text-foreground">{currencySymbol}{member.hourly_rate}/hr</td>
                      <td className="px-6 py-4 text-right font-bold text-coffee-fruit dark:text-primary">
                        {pendingHrs > 0 ? `${pendingHrs.toFixed(2)} hrs` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-yellow-600 dark:text-yellow-500">
                        {stats && stats.totalPending > 0 ? `${currencySymbol}${stats.totalPending.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <Button variant="ghost" size="sm" onClick={() => openManageModal(member)}>
                           <Pencil className="h-4 w-4 mr-1" /> Manage
                         </Button>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="m-0 animate-in fade-in duration-300 space-y-4">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-lg font-heading text-expresso dark:text-foreground">Pending Timesheets</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsAddLogOpen(true)}
                variant="outline"
                className="border-warm-roast/20 text-expresso/70 hover:bg-warm-roast/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('team_add_log')}
              </Button>
              <Button
                disabled={selectedLogIds.size === 0 || markPaidMutation.isPending}
                onClick={handleBatchMarkPaid}
                className="bg-coffee-fruit text-white hover:bg-coffee-fruit/90 shadow-sm"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Mark Selected as Paid ({selectedLogIds.size})
              </Button>
            </div>
          </div>
          {/* Mobile cards — Pending */}
          <div className="md:hidden flex flex-col gap-3">
            {loadingLogs ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-card rounded-xl border border-warm-roast/10 dark:border-border animate-pulse" />
              ))
            ) : pendingLogs.length === 0 ? (
              <div className="py-8 text-center text-expresso/40 dark:text-muted-foreground">No pending time logs</div>
            ) : pendingLogs.map(log => {
              const hours = resolveHours(log)
              const originalHours = calculateHoursWorked(log.start_time, log.end_time)
              const isAdjusted = log.adjusted_hours != null
              const rate = log.rate_snapshot ?? log.team_members?.hourly_rate ?? 0
              const pay = calculateTotalPay(hours, rate)
              return (
                <div key={log.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 dark:border-border shadow-sm p-4 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-expresso dark:text-foreground">{new Date(log.start_time).toLocaleDateString()}</div>
                      <div className="text-xs text-expresso/60 dark:text-muted-foreground font-medium">{log.team_members?.name || log.team_members?.invite_code || '—'}</div>
                      <div className="text-xs text-expresso/50 dark:text-muted-foreground">
                        {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedLogIds.has(log.id)}
                      onChange={() => toggleSelectLog(log.id)}
                      className="rounded border-warm-roast/20 text-coffee-fruit focus:ring-coffee-fruit/20 w-4 h-4 cursor-pointer mt-1 shrink-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} hrs</span>
                        {isAdjusted && <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">adj</span>}
                      </div>
                      {isAdjusted && <span className="text-xs text-expresso/50 dark:text-muted-foreground">{t('tracker_original_hours').replace('{hours}', originalHours.toFixed(2))}</span>}
                    </div>
                    <span className="font-bold text-warm-roast dark:text-foreground">{currencySymbol}{pay.toFixed(2)}</span>
                  </div>
                  {log.notes && <p className="text-xs text-expresso/60 dark:text-muted-foreground bg-warm-roast/5 dark:bg-muted/20 p-2 rounded-lg">{log.notes}</p>}
                  {log.adjustment_note && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-1.5">
                      {t('tracker_adjustment_reason')}: {log.adjustment_note}
                    </p>
                  )}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Button onClick={() => openEditHours(log)} size="sm" variant="ghost" className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10 dark:hover:bg-warm-roast/20">
                      <Pencil className="h-3.5 w-3.5 mr-1" /> {t('tracker_edit_hours')}
                    </Button>
                    <Button onClick={() => handleMarkPaid(log.id)} size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900/40 dark:hover:bg-green-900/20">
                      <Check className="h-4 w-4 mr-1" /> {t('team_mark_paid')}
                    </Button>
                    <Button onClick={() => handleDeleteLog(log.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table — Pending */}
          <div className="hidden md:block bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino dark:bg-muted/30 border-b border-warm-roast/10 dark:border-border font-bold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLogIds.size === pendingLogs.length && pendingLogs.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-warm-roast/20 text-coffee-fruit focus:ring-coffee-fruit/20 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4">Worker</th>
                  <th scope="col" className="px-6 py-4">Time Logged</th>
                  <th scope="col" className="px-6 py-4">Hours</th>
                  <th scope="col" className="px-6 py-4">Total Pay</th>
                  <th scope="col" className="px-6 py-4">Notes</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr><td colSpan={8} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">Loading...</td></tr>
                ) : pendingLogs.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">No pending time logs</td></tr>
                ) : (
                  pendingLogs.map(log => {
                    const hours = resolveHours(log)
                    const originalHours = calculateHoursWorked(log.start_time, log.end_time)
                    const isAdjusted = log.adjusted_hours != null
                    const rate = log.rate_snapshot ?? log.team_members?.hourly_rate ?? 0
                    const pay = calculateTotalPay(hours, rate)
                    const sTime = new Date(log.start_time)
                    const eTime = new Date(log.end_time)
                    return (
                      <tr key={log.id} className="border-b border-warm-roast/5 dark:border-border/50 hover:bg-warm-roast/5 dark:hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedLogIds.has(log.id)}
                            onChange={() => toggleSelectLog(log.id)}
                            className="rounded border-warm-roast/20 text-coffee-fruit focus:ring-coffee-fruit/20 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-expresso dark:text-foreground">{sTime.toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-expresso dark:text-foreground">{log.team_members?.name || log.team_members?.invite_code || '—'}</td>
                        <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground">
                          {sTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {eTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-coffee-fruit dark:text-primary">
                              {hours.toFixed(2)} hrs
                              {isAdjusted && <span className="ml-1.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">adj</span>}
                            </span>
                            {isAdjusted && (
                              <span className="text-xs text-expresso/50 dark:text-muted-foreground">
                                {t('tracker_original_hours').replace('{hours}', originalHours.toFixed(2))}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-warm-roast dark:text-foreground">{currencySymbol}{pay.toFixed(2)}</td>
                        <td className="px-6 py-4 text-expresso/60 dark:text-muted-foreground max-w-[200px]">
                          <div className="truncate">{log.notes || '—'}</div>
                          {log.adjustment_note && (
                            <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 truncate">
                              {t('tracker_adjustment_reason')}: {log.adjustment_note}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => openEditHours(log)}
                              size="sm"
                              variant="ghost"
                              className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10 dark:hover:bg-warm-roast/20"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> {t('tracker_edit_hours')}
                            </Button>
                            <Button
                              onClick={() => handleMarkPaid(log.id)}
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900/40 dark:hover:bg-green-900/20"
                            >
                              <Check className="h-4 w-4 mr-1" /> {t('team_mark_paid')}
                            </Button>
                            <Button
                              onClick={() => handleDeleteLog(log.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="paid" className="m-0 animate-in fade-in duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-heading text-expresso dark:text-foreground">Paid History</h3>
          </div>

          {/* Mobile cards — Paid */}
          <div className="md:hidden flex flex-col gap-3">
            {loadingLogs ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-card rounded-xl border border-warm-roast/10 dark:border-border animate-pulse" />
              ))
            ) : paidLogs.length === 0 ? (
              <div className="py-8 text-center text-expresso/40 dark:text-muted-foreground">No paid time logs in this period</div>
            ) : paidLogs.map(log => {
              const hours = resolveHours(log)
              const originalHours = calculateHoursWorked(log.start_time, log.end_time)
              const isAdjusted = log.adjusted_hours != null
              const rate = log.rate_snapshot ?? log.team_members?.hourly_rate ?? 0
              const pay = calculateTotalPay(hours, rate)
              return (
                <div key={log.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 dark:border-border shadow-sm p-4 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-expresso dark:text-foreground">{new Date(log.start_time).toLocaleDateString()}</div>
                      <div className="text-xs text-expresso/60 dark:text-muted-foreground font-medium">{log.team_members?.name || log.team_members?.invite_code || '—'}</div>
                      <div className="text-xs text-expresso/50 dark:text-muted-foreground">
                        {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} hrs</span>
                        {isAdjusted && <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">adj</span>}
                      </div>
                      {isAdjusted && <span className="text-xs text-expresso/50 dark:text-muted-foreground">{t('tracker_original_hours').replace('{hours}', originalHours.toFixed(2))}</span>}
                    </div>
                    <span className="font-bold text-warm-roast dark:text-foreground">{currencySymbol}{pay.toFixed(2)}</span>
                  </div>
                  {log.notes && <p className="text-xs text-expresso/60 dark:text-muted-foreground bg-warm-roast/5 dark:bg-muted/20 p-2 rounded-lg">{log.notes}</p>}
                  {log.adjustment_note && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-1.5">
                      {t('tracker_adjustment_reason')}: {log.adjustment_note}
                    </p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <Button onClick={() => handleRevertLog(log.id)} size="sm" variant="ghost" className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10 dark:hover:bg-warm-roast/20">
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t('team_revert_to_pending')}
                    </Button>
                    <Button onClick={() => handleDeleteLog(log.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table — Paid */}
          <div className="hidden md:block bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino dark:bg-muted/30 border-b border-warm-roast/10 dark:border-border font-bold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4">Worker</th>
                  <th scope="col" className="px-6 py-4">Time Logged</th>
                  <th scope="col" className="px-6 py-4">Hours</th>
                  <th scope="col" className="px-6 py-4">Total Pay</th>
                  <th scope="col" className="px-6 py-4">Notes</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr><td colSpan={7} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">Loading...</td></tr>
                ) : paidLogs.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">No paid time logs in this period</td></tr>
                ) : (
                  paidLogs.map(log => {
                    const hours = resolveHours(log)
                    const originalHours = calculateHoursWorked(log.start_time, log.end_time)
                    const isAdjusted = log.adjusted_hours != null
                    const rate = log.rate_snapshot ?? log.team_members?.hourly_rate ?? 0
                    const pay = calculateTotalPay(hours, rate)
                    const sTime = new Date(log.start_time)
                    const eTime = new Date(log.end_time)
                    return (
                      <tr key={log.id} className="border-b border-warm-roast/5 dark:border-border/50 hover:bg-warm-roast/5 dark:hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-medium text-expresso dark:text-foreground">{sTime.toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-expresso dark:text-foreground">{log.team_members?.name || log.team_members?.invite_code || '—'}</td>
                        <td className="px-6 py-4 text-expresso/70 dark:text-muted-foreground">
                          {sTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {eTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-coffee-fruit dark:text-primary">
                              {hours.toFixed(2)} hrs
                              {isAdjusted && <span className="ml-1.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">adj</span>}
                            </span>
                            {isAdjusted && (
                              <span className="text-xs text-expresso/50 dark:text-muted-foreground">
                                {t('tracker_original_hours').replace('{hours}', originalHours.toFixed(2))}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-warm-roast dark:text-foreground">{currencySymbol}{pay.toFixed(2)}</td>
                        <td className="px-6 py-4 text-expresso/60 dark:text-muted-foreground max-w-[200px]">
                          <div className="truncate">{log.notes || '—'}</div>
                          {log.adjustment_note && (
                            <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 truncate">
                              {t('tracker_adjustment_reason')}: {log.adjustment_note}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => handleRevertLog(log.id)}
                              size="sm"
                              variant="ghost"
                              className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10 dark:hover:bg-warm-roast/20 text-xs"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t('team_revert_to_pending')}
                            </Button>
                            <Button
                              onClick={() => handleDeleteLog(log.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="m-0 animate-in fade-in duration-300 space-y-6">
          {isMounted ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              modifiers={[restrictToWindowEdges]}
            >
              <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cardOrder.map((id) => {
                    const config = cardsConfig[id as keyof typeof cardsConfig]
                    return config ? <SortableStatCard key={config.id} {...config} /> : null
                  })}
                </div>
              </SortableContext>
              <DragOverlay adjustScale={false}>
                {activeId && cardsConfig[activeId as keyof typeof cardsConfig] ? (
                  <div className="w-full h-full opacity-90 cursor-grabbing shadow-2xl rounded-xl ring-2 ring-coffee-fruit/20">
                    <StatCard {...cardsConfig[activeId as keyof typeof cardsConfig]} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEFAULT_CARD_ORDER.map((id) => {
                const config = cardsConfig[id as keyof typeof cardsConfig]
                return config ? (
                  <div key={config.id} className={config.className}>
                    <StatCard {...config} />
                  </div>
                ) : null
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino dark:bg-muted/30 border-b border-warm-roast/10 dark:border-border font-bold tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Worker Name</th>
                    <th scope="col" className="px-6 py-4 text-right">Total Hours</th>
                    <th scope="col" className="px-6 py-4 text-right">Pending Pay</th>
                    <th scope="col" className="px-6 py-4 text-right">Total Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {!workerStats?.length ? (
                    <tr><td colSpan={4} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">No workers found to show statistics</td></tr>
                  ) : (
                    workerStats.map(stat => (
                      <tr key={stat.id} className="border-b border-warm-roast/5 dark:border-border/50 hover:bg-warm-roast/5 dark:hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-medium text-expresso dark:text-foreground">{stat.name}</td>
                        <td className="px-6 py-4 font-bold text-coffee-fruit dark:text-primary text-right">{stat.totalHours.toFixed(2)} hrs</td>
                        <td className="px-6 py-4 font-bold text-yellow-600 dark:text-yellow-500 text-right">{currencySymbol}{stat.totalPending.toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-green-600 dark:text-green-500 text-right">{currencySymbol}{stat.totalPaid.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border p-6 flex flex-col h-[400px]">
              <h3 className="text-lg font-heading text-expresso dark:text-foreground mb-4">Worker Earnings</h3>
              {workerStats.length > 0 && workerStats.some(s => s.totalEarnings > 0) ? (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workerStats} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
                        tickFormatter={(value) => `${currencySymbol}${value}`}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`${currencySymbol}${Number(value).toFixed(2)}`, 'Earnings']}
                      />
                      <Bar dataKey="totalEarnings" fill="#d97757" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-expresso/50 dark:text-muted-foreground">
                  No earning data available for this period.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <GenericModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        onConfirm={modalState.isConfirm ? modalState.onConfirm : undefined}
        confirmVariant={modalState.confirmVariant}
      >
        <p>{modalState.message}</p>
      </GenericModal>

      <GenericModal
        isOpen={!!editingLog}
        onOpenChange={(open) => !open && setEditingLog(null)}
        hideFooter={true}
        hideTitle={true}
        title={t('tracker_edit_hours')}
        contentClassName="sm:max-w-[380px]"
      >
        <h2 className="text-xl font-heading text-expresso mb-1">{t('tracker_edit_hours')}</h2>
        {editingLog && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-warm-roast/5 border border-warm-roast/10 text-sm text-expresso/70">
              <div className="font-medium text-expresso mb-0.5">{new Date(editingLog.start_time).toLocaleDateString()}</div>
              <div>
                {new Date(editingLog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(editingLog.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="mt-1">
                {t('tracker_original_hours').replace('{hours}', calculateHoursWorked(editingLog.start_time, editingLog.end_time).toFixed(2))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_hours_override_label')}</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={editHoursValue}
                onChange={e => setEditHoursValue(e.target.value)}
                placeholder={t('tracker_hours_override_placeholder')}
                className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_adjustment_reason_label')}</label>
              <textarea
                rows={2}
                value={editAdjustmentNote}
                onChange={e => setEditAdjustmentNote(e.target.value)}
                placeholder={t('tracker_adjustment_reason_placeholder')}
                className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAdjustedHours}
                disabled={updateHoursMutation.isPending}
                className="flex-1 bg-coffee-fruit text-white hover:bg-coffee-fruit/90"
              >
                {updateHoursMutation.isPending ? t('tracker_adjust_saving') : t('tracker_save_adjustment')}
              </Button>
              {editingLog.adjusted_hours != null && (
                <Button
                  onClick={async () => {
                    try {
                      await updateHoursMutation.mutateAsync({ logId: editingLog.id, adjustedHours: null, adjustmentNote: null })
                      setEditingLog(null)
                    } catch (err) {
                      console.error(err)
                      showAlert("Error", "Failed to clear adjustment.")
                    }
                  }}
                  disabled={updateHoursMutation.isPending}
                  variant="outline"
                  className="text-expresso/60 border-warm-roast/20"
                >
                  {t('tracker_clear_adjustment')}
                </Button>
              )}
            </div>
          </div>
        )}
      </GenericModal>

      {/* Add log on behalf of a worker */}
      <GenericModal
        isOpen={isAddLogOpen}
        onOpenChange={(open) => {
          setIsAddLogOpen(open)
          if (!open) {
            setAddLogWorkerId('')
            setAddLogDate('')
            setAddLogStart('')
            setAddLogEnd('')
            setAddLogNotes('')
            setAddLogFormError('')
          }
        }}
        hideFooter={true}
        hideTitle={true}
        title={t('team_add_log_title')}
        contentClassName="sm:max-w-[450px]"
      >
        <h2 className="text-xl font-heading text-expresso mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          {t('team_add_log_title')}
        </h2>
        <form onSubmit={handleAddLogSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-expresso mb-1">{t('team_add_log_worker')}</label>
            <select
              required
              value={addLogWorkerId}
              onChange={e => setAddLogWorkerId(e.target.value)}
              className="w-full p-2 border border-warm-roast/20 dark:border-border rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none bg-card text-expresso dark:text-foreground"
            >
              <option value="">{t('team_add_log_worker_placeholder')}</option>
              {teamMembers?.filter(m => m.status === 'active').map(m => (
                <option key={m.id} value={m.id}>{m.name || m.invite_code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_date')}</label>
            <input
              type="date"
              required
              value={addLogDate}
              onChange={e => setAddLogDate(e.target.value)}
              className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_start')}</label>
              <input
                type="time"
                required
                value={addLogStart}
                onChange={e => setAddLogStart(e.target.value)}
                className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_end')}</label>
              <input
                type="time"
                required
                value={addLogEnd}
                onChange={e => setAddLogEnd(e.target.value)}
                className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none"
              />
            </div>
          </div>
          {addLogDate && addLogStart && addLogEnd && (
            <div className={`p-3 rounded-lg border text-center ${
              addLogPreviewedHours > 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {addLogPreviewedHours > 0 ? (
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  ⏱ {t('tracker_hours_logged').replace('{hours}', addLogPreviewedHours.toFixed(2))}
                </p>
              ) : (
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{t('tracker_end_after_start')}</p>
              )}
            </div>
          )}
          {addLogFormError && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{addLogFormError}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-expresso mb-1">{t('tracker_field_notes')}</label>
            <textarea
              rows={3}
              value={addLogNotes}
              onChange={e => setAddLogNotes(e.target.value)}
              className="w-full p-2 border border-warm-roast/20 rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none resize-none"
              placeholder={t('tracker_notes_placeholder')}
            />
          </div>
          <Button
            type="submit"
            disabled={addLogMutation.isPending || (addLogDate && addLogStart && addLogEnd ? addLogPreviewedHours <= 0 : false)}
            className="w-full bg-coffee-fruit text-white hover:bg-coffee-fruit/90"
          >
            {addLogMutation.isPending ? t('tracker_saving') : t('team_add_log_save')}
          </Button>
        </form>
      </GenericModal>
    </div>
  )
}
