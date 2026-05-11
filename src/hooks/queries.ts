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
  CustomerRecord,
} from '@/types'
import {
  createOrder,
  updateOrder,
  updateFulfillmentStatus,
  updatePaymentStatus,
} from '@/actions/orders'
import { createCustomer, updateCustomer } from '@/actions/customers'
import {
  createInventoryItem,
  updateInventoryItem,
} from '@/actions/inventory'
import { updateSettings } from '@/actions/settings'
import type { FulfillmentStatus, PaymentStatus, UserSettingsUpdateParams } from '@/types'

// ─── Query Keys ──────────────────────────────────────────────
export const queryKeys = {
  orders: ['orders'] as const,
  completedOrders: ['orders', 'completed'] as const,
  customers: ['customers'] as const,
  inventory: ['inventory'] as const,
  settings: ['settings'] as const,
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

export function useCompletedOrders() {
  return useQuery<OrderWithCustomer[]>({
    queryKey: queryKeys.completedOrders,
    queryFn: () => fetchJson('/api/orders/completed'),
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
