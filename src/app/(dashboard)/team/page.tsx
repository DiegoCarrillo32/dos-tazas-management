'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Users, Clock, Check, Copy, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3 } from 'lucide-react'
import { useTeamMembers, useTeamTimeLogs, useGenerateTeamInvite, useUpdateTeamMember, useMarkTimeLogsPaid, useDeleteTeamMember, useSettings } from '@/hooks/queries'
import { calculateHoursWorked, calculateTotalPay } from '@/utils/tracker-logic'
import { TeamMemberRecord, TeamMemberStatus } from '@/types'

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

  const handleGenerateInvite = async () => {
    if (!inviteName.trim()) {
      alert("Please enter a name for the worker.")
      return
    }
    try {
      const data = await generateInviteMutation.mutateAsync({ name: inviteName.trim(), hourlyRate: Number(inviteRate) })
      setInviteCode(data.invite_code)
    } catch (err) {
      console.error(err)
      alert("Failed to generate invite")
    }
  }

  const handleCopyCode = (code: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${code}` : code
    navigator.clipboard.writeText(url)
    alert("Invite URL copied to clipboard!")
  }

  const handleMarkPaid = async (logId: string) => {
    try {
      await markPaidMutation.mutateAsync([logId])
    } catch (err) {
      console.error(err)
      alert("Failed to mark as paid")
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
      alert("Failed to update worker")
    }
  }

  const handleDeleteMember = async () => {
    if (!managingMember) return
    if (confirm("Are you sure you want to delete this worker? Their past time logs will remain but they won't be able to log new ones.")) {
      try {
        await deleteMemberMutation.mutateAsync(managingMember.id)
        setManagingMember(null)
      } catch (err) {
        console.error(err)
        alert("Failed to delete worker")
      }
    }
  }

  const pendingLogs = timeLogs?.filter(log => log.status === 'pending') || []

  // Calculate statistics per worker
  const workerStats = teamMembers?.map(member => {
    const memberLogs = timeLogs?.filter(log => log.team_members?.invite_code === member.invite_code) || []
    
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
      totalPending
    }
  }) || []

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Team & Workers"
        subtitle="Manage your employees, set hourly rates, and review timesheets."
        action={
          <>
          <Dialog open={isInviteOpen} onOpenChange={(open) => {
            setIsInviteOpen(open)
            if (!open) setInviteCode(null)
          }}>
            <DialogTrigger render={<Button className="bg-white dark:bg-card text-coffee-fruit hover:bg-warm-roast/10 dark:hover:bg-warm-roast/30 border border-coffee-fruit/20 dark:border-border rounded-full px-6 shadow-sm transition-all" />}>
              <Plus className="mr-2 h-4 w-4" /> Invite Worker
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogTitle className="text-xl font-heading text-expresso mb-4">Invite New Worker</DialogTitle>
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
            </DialogContent>
          </Dialog>
          <Dialog open={!!managingMember} onOpenChange={(open) => !open && setManagingMember(null)}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogTitle className="text-xl font-heading text-expresso mb-4">Manage Worker</DialogTitle>
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
            </DialogContent>
          </Dialog>
          </>
        }
      />

      <Tabs defaultValue="roster" className="w-full space-y-6">
        <TabsList className="bg-white dark:bg-card border border-warm-roast/10 dark:border-border rounded-xl p-1 h-auto w-full flex flex-row gap-1 max-w-[400px]">
          <TabsTrigger value="roster" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:dark:bg-primary/20 data-[state=active]:text-coffee-fruit data-[state=active]:dark:text-primary text-expresso/70 dark:text-muted-foreground transition-all py-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 shrink-0" /> Roster
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:dark:bg-primary/20 data-[state=active]:text-coffee-fruit data-[state=active]:dark:text-primary text-expresso/70 dark:text-muted-foreground transition-all py-2 text-xs sm:text-sm">
            <Clock className="w-4 h-4 mr-1 shrink-0" /> Timesheets
            {pendingLogs.length > 0 && (
              <span className="ml-2 bg-coffee-fruit text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingLogs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:dark:bg-primary/20 data-[state=active]:text-coffee-fruit data-[state=active]:dark:text-primary text-expresso/70 dark:text-muted-foreground transition-all py-2 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-1 shrink-0" /> Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="m-0 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-warm-roast/10 overflow-hidden">
            <table className="w-full text-sm text-left">
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

        <TabsContent value="timesheets" className="m-0 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-expresso/60 dark:text-muted-foreground uppercase bg-white-pergamino dark:bg-muted/30 border-b border-warm-roast/10 dark:border-border font-semibold tracking-wider">
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
                  <tr><td colSpan={8} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">Loading...</td></tr>
                ) : !timeLogs?.length ? (
                  <tr><td colSpan={8} className="p-8 text-center text-expresso/50 dark:text-muted-foreground">No time logs found</td></tr>
                ) : (
                  timeLogs.map(log => {
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
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            log.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.status === 'pending' && (
                            <Button 
                              onClick={() => handleMarkPaid(log.id)} 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4 mr-1" /> Mark Paid
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
        </TabsContent>

        <TabsContent value="statistics" className="m-0 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-warm-roast/10 dark:border-border overflow-hidden">
            <table className="w-full text-sm text-left">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
