'use client'

import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Users, Clock, Check, Copy, Pencil, Calendar, CheckSquare } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, CheckCircle2, Wallet, Coins, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTeamMembers, useTeamTimeLogs, useGenerateTeamInvite, useUpdateTeamMember, useMarkTimeLogsPaid, useDeleteTeamMember, useSettings } from '@/hooks/queries'
import { calculateHoursWorked, calculateTotalPay } from '@/utils/tracker-logic'
import { TeamMemberRecord, TeamMemberStatus } from '@/types'
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
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('dos_tazas_team_stats_order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_CARD_ORDER.length) {
          setCardOrder(parsed)
        }
      } catch { }
    }
  }, [])

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
        const hours = calculateHoursWorked(log.start_time, log.end_time)
        totalHours += hours
        const pay = calculateTotalPay(hours, log.team_members?.hourly_rate || 0)
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
              <Button className="bg-white dark:bg-card text-coffee-fruit hover:bg-warm-roast/10 dark:hover:bg-warm-roast/30 border border-coffee-fruit/20 dark:border-border rounded-full px-6 shadow-sm transition-all">
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
                    className="w-full p-2 border border-warm-roast/20 dark:border-border rounded-lg focus:ring-2 focus:ring-coffee-fruit/20 outline-none bg-white dark:bg-card"
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
                    className="text-red-600 border-red-200 hover:bg-red-50"
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
        <TabsList className="bg-white dark:bg-card border border-warm-roast/10 dark:border-border rounded-xl p-1 h-auto flex flex-row gap-1 w-full overflow-x-auto no-scrollbar sm:w-auto">
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
            <SelectTrigger className="w-[180px] bg-white dark:bg-card border-warm-roast/20 dark:border-border h-9 text-sm">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {availableMonths.map(m => (
                <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

        <TabsContent value="roster" className="m-0 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-warm-roast/10 overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-semibold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Invite Code</th>
                  <th scope="col" className="px-6 py-4">Worker ID</th>
                  <th scope="col" className="px-6 py-4">Hourly Rate</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingTeam ? (
                  <tr><td colSpan={5} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">Loading...</td></tr>
                ) : !teamMembers?.length ? (
                  <tr><td colSpan={5} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">No team members found</td></tr>
                ) : (
                  teamMembers.map(member => (
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
                      <td className="px-6 py-4 text-right">
                         <Button variant="ghost" size="sm" onClick={() => openManageModal(member)}>
                           <Pencil className="h-4 w-4 mr-1" /> Manage
                         </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="m-0 animate-in fade-in duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-heading text-expresso dark:text-foreground">Pending Timesheets</h3>
            <Button 
              disabled={selectedLogIds.size === 0 || markPaidMutation.isPending}
              onClick={handleBatchMarkPaid}
              className="bg-coffee-fruit text-white hover:bg-coffee-fruit/90 shadow-sm"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Mark Selected as Paid ({selectedLogIds.size})
            </Button>
          </div>
          <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino dark:bg-muted/30 border-b border-warm-roast/10 dark:border-border font-semibold tracking-wider">
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
                    const hours = calculateHoursWorked(log.start_time, log.end_time)
                    const rate = log.team_members?.hourly_rate || 0
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
                        <td className="px-6 py-4 font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} hrs</td>
                        <td className="px-6 py-4 font-semibold text-warm-roast dark:text-foreground">{currencySymbol}{pay.toFixed(2)}</td>
                        <td className="px-6 py-4 text-expresso/60 dark:text-muted-foreground max-w-[200px] truncate">{log.notes || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            onClick={() => handleMarkPaid(log.id)} 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" /> Mark Paid
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

        <TabsContent value="paid" className="m-0 animate-in fade-in duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-heading text-expresso dark:text-foreground">Paid History</h3>
          </div>
          <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino dark:bg-muted/30 border-b border-warm-roast/10 dark:border-border font-semibold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4">Worker</th>
                  <th scope="col" className="px-6 py-4">Time Logged</th>
                  <th scope="col" className="px-6 py-4">Hours</th>
                  <th scope="col" className="px-6 py-4">Total Pay</th>
                  <th scope="col" className="px-6 py-4">Notes</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr><td colSpan={7} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">Loading...</td></tr>
                ) : paidLogs.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">No paid time logs in this period</td></tr>
                ) : (
                  paidLogs.map(log => {
                    const hours = calculateHoursWorked(log.start_time, log.end_time)
                    const rate = log.team_members?.hourly_rate || 0
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
                        <td className="px-6 py-4 font-bold text-coffee-fruit dark:text-primary">{hours.toFixed(2)} hrs</td>
                        <td className="px-6 py-4 font-semibold text-warm-roast dark:text-foreground">{currencySymbol}{pay.toFixed(2)}</td>
                        <td className="px-6 py-4 text-expresso/60 dark:text-muted-foreground max-w-[200px] truncate">{log.notes || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {log.status}
                          </span>
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
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino dark:bg-muted/30 border-b border-warm-roast/10 dark:border-border font-semibold tracking-wider">
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
                        <td className="px-6 py-4 font-semibold text-yellow-600 dark:text-yellow-500 text-right">{currencySymbol}{stat.totalPending.toFixed(2)}</td>
                        <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-500 text-right">{currencySymbol}{stat.totalPaid.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border p-6 flex flex-col h-[400px]">
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
                        formatter={(value: any) => [`${currencySymbol}${Number(value).toFixed(2)}`, 'Earnings']}
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
    </div>
  )
}
