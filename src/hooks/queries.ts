'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  OrderWithCustomer,
  CustomerWithLastPurchase,
  InventoryRecord,
  UserSettingsRecord,
  OrderInsertParams,
  OrderUpdateParams,
  CustomerInsertParams,
  CustomerUpdateParams,
  InventoryInsertParams,
  InventoryUpdateParams,
  EquipmentRecord,
  EquipmentInsertParams,
  EquipmentUpdateParams,
  MaintenanceLogRecord,
  MaintenanceLogInsertParams,
  MaintenanceLogUpdateParams,
  GreenCoffeeLotRecord,
  GreenCoffeeLotInsertParams,
  GreenCoffeeLotUpdateParams,
  RoastBatchRecord,
  RoastBatchInsertParams,
  RoastBatchUpdateParams,
  B2BPartnerRecord,
  B2BPricingRecord,
  B2BRecurringOrderRecord,
  B2BRecurringOrderInsertParams,
  B2BRecurringOrderUpdateParams,
} from '@/types'
import {
  createOrder,
  updateOrder,
  updateFulfillmentStatus,
  updatePaymentStatus,
  deleteOrder,
} from '@/actions/orders'
import { createCustomer, updateCustomer, deleteCustomer } from '@/actions/customers'
import {
  createInventoryItem,
  updateInventoryItem,
} from '@/actions/inventory'
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '@/actions/equipment'
import {
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
} from '@/actions/maintenanceLogs'
import {
  createGreenCoffeeLot,
  updateGreenCoffeeLot,
  deleteGreenCoffeeLot,
} from '@/actions/greenCoffeeLots'
import {
  createRoastBatch,
  updateRoastBatch,
  deleteRoastBatch,
} from '@/actions/roastBatches'
import { updateSettings } from '@/actions/settings'
import {
  generateInvite,
  acceptInvite,
  revokePartner,
  restorePartner,
  deletePartner,
} from '@/actions/b2bPartners'
import {
  setPartnerPricing,
  deletePartnerPricing,
} from '@/actions/b2bPricing'
import {
  createRecurringOrder,
  updateRecurringOrder,
  deleteRecurringOrder,
  confirmOrderFromTemplate,
} from '@/actions/b2bRecurring'
import type { FulfillmentStatus, PaymentStatus, UserSettingsUpdateParams } from '@/types'

// ─── Query Keys ──────────────────────────────────────────────
export const queryKeys = {
  orders: ['orders'] as const,
  completedOrders: ['orders', 'completed'] as const,
  customers: ['customers'] as const,
  inventory: ['inventory'] as const,
  settings: ['settings'] as const,
  equipment: ['equipment'] as const,
  maintenanceLogs: (equipmentId: string) => ['maintenance_logs', equipmentId] as const,
  greenCoffeeLots: (inventoryId: string) => ['green_coffee_lots', inventoryId] as const,
  roastBatches: ['roast_batches'] as const,
  b2bPartners: ['b2b_partners'] as const,
  b2bPartnerPricing: (partnerId: string) => ['b2b_pricing', partnerId] as const,
  b2bRecurringOrders: (partnerId: string) => ['b2b_recurring_orders', partnerId] as const,
  b2bOrders: (partnerId?: string) => ['b2b_orders', partnerId || 'all'] as const,
  teamMembers: ['team_members'] as const,
  teamTimeLogs: ['team_time_logs'] as const,
  workerTimeLogs: ['worker_time_logs'] as const,
}

// ─── Fetch Helpers ───────────────────────────────────────────
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Failed to fetch ${url}`)
  }
  return res.json()
}

// ─── Query Hooks ─────────────────────────────────────────────
export function useOrders() {
  return useQuery<OrderWithCustomer[]>({
    queryKey: queryKeys.orders,
    queryFn: () => fetchJson('/api/orders'),
  })
}

export function useCompletedOrders(page: number = 1, limit: number = 10) {
  return useQuery<{ data: OrderWithCustomer[]; total: number }>({
    queryKey: [...queryKeys.completedOrders, page, limit],
    queryFn: () => fetchJson(`/api/orders/completed?page=${page}&limit=${limit}`),
  })
}

export function useCustomers() {
  return useQuery<CustomerWithLastPurchase[]>({
    queryKey: queryKeys.customers,
    queryFn: () => fetchJson('/api/customers'),
  })
}

export function useInventory() {
  return useQuery<InventoryRecord[]>({
    queryKey: queryKeys.inventory,
    queryFn: () => fetchJson('/api/inventory'),
  })
}

export function useSettings() {
  return useQuery<UserSettingsRecord>({
    queryKey: queryKeys.settings,
    queryFn: () => fetchJson('/api/settings'),
  })
}

export function useEquipment() {
  return useQuery<EquipmentRecord[]>({
    queryKey: queryKeys.equipment,
    queryFn: () => fetchJson('/api/equipment'),
  })
}

export function useMaintenanceLogs(equipmentId: string) {
  return useQuery<MaintenanceLogRecord[]>({
    queryKey: queryKeys.maintenanceLogs(equipmentId),
    queryFn: () => fetchJson(`/api/maintenance/${equipmentId}`),
    enabled: !!equipmentId,
  })
}

export function useGreenCoffeeLots(inventoryId: string) {
  return useQuery<GreenCoffeeLotRecord[]>({
    queryKey: queryKeys.greenCoffeeLots(inventoryId),
    queryFn: () => fetchJson(`/api/inventory/${inventoryId}/lots`),
    enabled: !!inventoryId,
  })
}

export function useRoastBatches() {
  return useQuery<RoastBatchRecord[]>({
    queryKey: queryKeys.roastBatches,
    queryFn: () => fetchJson('/api/roasts'),
  })
}

// --- B2B Portal Hooks ---
export function usePartners() {
  return useQuery<B2BPartnerRecord[] | B2BPartnerRecord>({
    queryKey: queryKeys.b2bPartners,
    queryFn: () => fetchJson('/api/b2b/partners'),
  })
}

export function usePartnerPricing(partnerId: string) {
  return useQuery<B2BPricingRecord[]>({
    queryKey: queryKeys.b2bPartnerPricing(partnerId),
    queryFn: () => fetchJson(`/api/b2b/pricing/${partnerId}`),
    enabled: !!partnerId,
  })
}

export function usePartnerRecurringOrders(partnerId: string) {
  return useQuery<B2BRecurringOrderRecord[]>({
    queryKey: queryKeys.b2bRecurringOrders(partnerId),
    queryFn: () => fetchJson(`/api/b2b/recurring/${partnerId}`),
    enabled: !!partnerId,
  })
}

export function useB2BOrders(partnerId?: string) {
  return useQuery<OrderWithCustomer[]>({
    queryKey: queryKeys.b2bOrders(partnerId),
    queryFn: () => {
      const url = partnerId ? `/api/b2b/orders?partnerId=${partnerId}` : '/api/b2b/orders'
      return fetchJson(url)
    },
  })
}

// ─── Mutation Hooks ──────────────────────────────────────────

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: OrderInsertParams) => createOrder(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.inventory })
    },
  })
}

export function useUpdateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: OrderUpdateParams }) =>
      updateOrder(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.completedOrders })
      qc.invalidateQueries({ queryKey: queryKeys.inventory })
    },
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.completedOrders })
      qc.invalidateQueries({ queryKey: queryKeys.inventory })
    },
  })
}

export function useUpdateFulfillment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FulfillmentStatus }) =>
      updateFulfillmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.completedOrders })
    },
  })
}

export function useUpdatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      updatePaymentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.completedOrders })
    },
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: CustomerInsertParams) => createCustomer(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers })
    },
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: CustomerUpdateParams }) =>
      updateCustomer(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers })
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.completedOrders })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers })
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.completedOrders })
    },
  })
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: InventoryInsertParams) => createInventoryItem(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory })
    },
  })
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: InventoryUpdateParams }) =>
      updateInventoryItem(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory })
    },
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: UserSettingsUpdateParams) => updateSettings(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}

export function useCreateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: EquipmentInsertParams) => createEquipment(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.equipment })
    },
  })
}

export function useUpdateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: EquipmentUpdateParams }) =>
      updateEquipment(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.equipment })
    },
  })
}

export function useDeleteEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.equipment })
    },
  })
}

export function useCreateMaintenanceLog(equipmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: MaintenanceLogInsertParams) => createMaintenanceLog(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs(equipmentId) })
    },
  })
}

export function useUpdateMaintenanceLog(equipmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: MaintenanceLogUpdateParams }) =>
      updateMaintenanceLog(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs(equipmentId) })
    },
  })
}

export function useDeleteMaintenanceLog(equipmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMaintenanceLog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs(equipmentId) })
    },
  })
}

export function useCreateGreenCoffeeLot(inventoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: GreenCoffeeLotInsertParams) => createGreenCoffeeLot(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.greenCoffeeLots(inventoryId) })
    },
  })
}

export function useUpdateGreenCoffeeLot(inventoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: GreenCoffeeLotUpdateParams }) =>
      updateGreenCoffeeLot(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.greenCoffeeLots(inventoryId) })
    },
  })
}

export function useDeleteGreenCoffeeLot(inventoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGreenCoffeeLot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.greenCoffeeLots(inventoryId) })
    },
  })
}

export function useCreateRoastBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: RoastBatchInsertParams) => createRoastBatch(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roastBatches })
      qc.invalidateQueries({ queryKey: queryKeys.inventory }) // Roast deducts stock
    },
  })
}

export function useUpdateRoastBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: RoastBatchUpdateParams }) =>
      updateRoastBatch(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roastBatches })
    },
  })
}

export function useDeleteRoastBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRoastBatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roastBatches })
    },
  })
}

// --- B2B Portal Mutations ---

export function useGenerateInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ companyName, contactName, contactPhone, inviteEmail }: { companyName: string, contactName: string | null, contactPhone: string | null, inviteEmail: string | null }) => 
      generateInvite(companyName, contactName, contactPhone, inviteEmail),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.b2bPartners })
    },
  })
}

export function useAcceptInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => acceptInvite(inviteCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.b2bPartners })
    },
  })
}

export function useRevokePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (partnerId: string) => revokePartner(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.b2bPartners })
    }
  })
}

export function useRestorePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (partnerId: string) => restorePartner(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.b2bPartners })
    }
  })
}

export function useDeletePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (partnerId: string) => deletePartner(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.b2bPartners })
    }
  })
}

export function useSetPartnerPricing(partnerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ inventoryId, pricePerKg }: { inventoryId: string, pricePerKg: number }) => 
      setPartnerPricing(partnerId, inventoryId, pricePerKg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.b2bPartnerPricing(partnerId) })
    },
  })
}

export function useDeletePartnerPricing(partnerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pricingId: string) => deletePartnerPricing(pricingId, partnerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.b2bPartnerPricing(partnerId) })
    },
  })
}

export function useCreateRecurringOrder(partnerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: B2BRecurringOrderInsertParams) => createRecurringOrder(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.b2bRecurringOrders(partnerId) })
    },
  })
}

export function useUpdateRecurringOrder(partnerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: B2BRecurringOrderUpdateParams }) =>
      updateRecurringOrder(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.b2bRecurringOrders(partnerId) })
    },
  })
}

export function useDeleteRecurringOrder(partnerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRecurringOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.b2bRecurringOrders(partnerId) })
    },
  })
}

export function useConfirmOrderFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recurringId: string) => confirmOrderFromTemplate(recurringId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders })
      qc.invalidateQueries({ queryKey: queryKeys.b2bOrders() })
    },
  })
}

// ============================================================
// Team & Time Tracker Hooks
// ============================================================
import { getTeamMembers, generateTeamInvite, updateTeamMember, deleteTeamMember } from '@/actions/team'
import { getTeamTimeLogs, getWorkerTimeLogs, logTime, markTimeLogsPaid, deleteTimeLog } from '@/actions/tracker'
import { TeamMemberRecord, TimeLogRecord, TeamMemberUpdateParams } from '@/types'

export function useTeamMembers() {
  return useQuery<TeamMemberRecord[]>({
    queryKey: queryKeys.teamMembers,
    queryFn: () => getTeamMembers(),
  })
}

export function useGenerateTeamInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, hourlyRate }: { name: string, hourlyRate: number }) => generateTeamInvite(name, hourlyRate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamMembers })
    },
  })
}

export function useUpdateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string, params: TeamMemberUpdateParams }) => updateTeamMember(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamMembers })
    },
  })
}

export function useDeleteTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamMembers })
    },
  })
}

export function useTeamTimeLogs() {
  return useQuery<TimeLogRecord[]>({
    queryKey: queryKeys.teamTimeLogs,
    queryFn: () => getTeamTimeLogs(),
  })
}

export function useWorkerTimeLogs() {
  return useQuery<TimeLogRecord[]>({
    queryKey: queryKeys.workerTimeLogs,
    queryFn: () => getWorkerTimeLogs(),
  })
}

export function useLogTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ startTime, endTime, notes }: { startTime: string, endTime: string, notes: string | null }) => 
      logTime(startTime, endTime, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workerTimeLogs })
    },
  })
}

export function useMarkTimeLogsPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (logIds: string[]) => markTimeLogsPaid(logIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamTimeLogs })
    },
  })
}

export function useDeleteTimeLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (logId: string) => deleteTimeLog(logId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workerTimeLogs })
      qc.invalidateQueries({ queryKey: queryKeys.teamTimeLogs })
    },
  })
}

