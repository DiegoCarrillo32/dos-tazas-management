"use client";

import { useState } from "react";
import {
  Coffee,
  Phone,
  User,
  Calendar,
  DollarSign,
  Edit,
  CheckCircle,
  Package,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderForm } from "@/components/OrderForm";
import type { OrderWithCustomer, CustomerRecord, InventoryRecord, UserSettingsRecord } from "@/types";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useDeleteOrder } from "@/hooks/queries";

interface OrderDetailsModalProps {
  order: OrderWithCustomer;
  customers: CustomerRecord[];
  inventoryItems: InventoryRecord[];
  settings?: UserSettingsRecord;
  onClose?: () => void;
}

export function OrderDetailsModal({
  order,
  customers,
  inventoryItems,
  settings,
  onClose,
}: OrderDetailsModalProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const deleteMutation = useDeleteOrder();

  const handleDelete = () => {
    if (window.confirm(t('delete_confirm') || 'Are you sure you want to delete this order?')) {
      deleteMutation.mutate(order.id, {
        onSuccess: () => {
          if (onClose) onClose();
        },
      });
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto">
        <OrderForm
          customers={customers}
          inventoryItems={inventoryItems}
          settings={settings}
          initialData={order}
          onSuccess={() => {
            setIsEditing(false);
            if (onClose) onClose();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const fulfillmentIcons = {
    pending: <Clock className="h-4 w-4 text-yellow-600" />,
    roasted: <Package className="h-4 w-4 text-orange-600" />,
    delivered: <CheckCircle className="h-4 w-4 text-green-600" />,
  };

  return (
    <div className="bg-white-pergamino rounded-xl overflow-hidden">
      <div className="bg-expresso p-6 text-white flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-heading flex items-center gap-2">
            <User className="h-6 w-6" />
            {order.customers?.full_name}
          </h2>
          <p className="text-white/70 flex items-center gap-2 mt-1 text-sm">
            <Calendar className="h-4 w-4" />
            {new Date(order.order_date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            ${Number(order.total_price).toFixed(2)}
          </div>
          <div className="text-sm text-white/70">
            {order.amount_grams}g {t('order_total')}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Badges */}
        <div className="flex gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              order.fulfillment_status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : order.fulfillment_status === "roasted"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {fulfillmentIcons[order.fulfillment_status]}
            <span className="capitalize">
              {order.fulfillment_status === 'pending' ? t('orders_pending') : order.fulfillment_status === 'roasted' ? t('orders_roasted') : t('orders_delivered')}
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              order.payment_status === "paid"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span className="capitalize">
              {order.payment_status === "pending" ? t('order_unpaid') : t('order_paid')}
            </span>
          </div>
        </div>

        {/* Coffee Details */}
        <div className="bg-warm-roast/5 rounded-lg p-4 border border-warm-roast/10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {order.inventory?.item_name && (
            <div className="sm:col-span-2 border-b border-warm-roast/10 pb-3">
              <div className="text-xs text-expresso/50 font-bold uppercase tracking-wider mb-1">
                {t('order_form_coffee_bean').split(' (')[0]}
              </div>
              <div className="flex items-center gap-2 text-expresso font-bold text-base">
                <Coffee className="h-5 w-5 text-coffee-fruit" />
                {order.inventory.item_name}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-expresso/50 font-bold uppercase tracking-wider mb-1">
              {t('order_form_roast_level')}
            </div>
            <div className="flex items-center gap-2 text-expresso font-semibold">
              <Coffee className="h-4 w-4 text-warm-roast" />
              {order.roast_level}
            </div>
          </div>
          <div>
            <div className="text-xs text-expresso/50 font-bold uppercase tracking-wider mb-1">
              {t('order_form_preparation')}
            </div>
            <div className="flex items-center gap-2 text-expresso font-semibold">
              <span className="text-warm-roast font-bold leading-none">♨</span>
              {order.preparation_method}
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.origin_notes && (
          <div>
            <div className="text-xs text-expresso/50 font-bold uppercase tracking-wider mb-1">
              {t('order_form_origin_notes').replace(' (Farmer Recognition)', '')}
            </div>
            <div className="bg-white p-3 rounded-lg border border-warm-roast/10 text-sm text-expresso italic">
              &quot;{order.origin_notes}&quot;
            </div>
          </div>
        )}

        {/* Customer Contact */}
        {order.customers?.phone && (
          <div className="flex items-center gap-2 text-sm text-expresso border-t border-warm-roast/10 pt-4">
            <Phone className="h-4 w-4 text-warm-roast" />
            <a
              href={`tel:${order.customers.phone}`}
              className="hover:underline text-coffee-fruit"
            >
              {order.customers.phone}
            </a>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-warm-roast/10">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 mr-auto"
          >
            <Trash2 className="h-4 w-4" />
            {t('delete')}
          </Button>
          <Button variant="outline" onClick={onClose} className="text-expresso">
            {t('order_close')}
          </Button>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-coffee-fruit hover:bg-warm-roast text-white gap-2"
          >
            <Edit className="h-4 w-4" />
            {t('order_form_edit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
