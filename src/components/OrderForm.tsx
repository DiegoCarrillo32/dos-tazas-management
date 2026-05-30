"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerForm } from "@/components/CustomerForm";
import { FormCard } from "@/components/ui/form-card";
import type { CustomerRecord, OrderInsertParams, InventoryRecord, UserSettingsRecord } from "@/types";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useCreateOrder, useUpdateOrder, usePartners } from '@/hooks/queries';
import { toast } from "sonner";

const PREPARATION_METHODS = [
  { value: "Whole Bean", labelKey: "prep_whole_bean" as const },
  { value: "Elec Perk", labelKey: "prep_elec_perk" as const },
  { value: "Drip", labelKey: "prep_drip" as const },
  { value: "Auto-Drip", labelKey: "prep_auto_drip" as const },
  { value: "Coarse", labelKey: "prep_coarse" as const },
];
const ROAST_LEVELS = [
  { value: "Light", labelKey: "roast_light" as const },
  { value: "Medium-Light", labelKey: "roast_medium_light" as const },
  { value: "Medium", labelKey: "roast_medium" as const },
  { value: "Medium-Dark", labelKey: "roast_medium_dark" as const },
  { value: "Dark", labelKey: "roast_dark" as const },
];

const orderSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  inventory_id: z.string().optional(),
  preparation_method: z.string().min(1, 'Preparation method is required'),
  roast_level: z.string().min(1, 'Roast level is required'),
  amount_grams: z.number().min(1, 'Amount must be greater than 0'),
  bag_count: z.number().min(1, 'At least 1 bag required'),
  total_price: z.number().min(0, 'Cannot be negative'),
  origin_notes: z.string().optional(),
  company_name: z.string().optional(),
  partner_id: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  customers: CustomerRecord[];
  inventoryItems?: InventoryRecord[];
  settings?: UserSettingsRecord;
  initialData?: OrderInsertParams & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
  isB2B?: boolean;
}

export function OrderForm({
  customers: initialCustomers,
  inventoryItems = [],
  settings,
  initialData,
  onSuccess,
  onCancel,
  isB2B = false,
}: OrderFormProps) {
  const { t } = useTranslation();

  const [customersList, setCustomersList] = useState(initialCustomers);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    register,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: initialData
      ? {
          customer_id: initialData.customer_id,
          inventory_id: initialData.inventory_id || undefined,
          preparation_method: initialData.preparation_method,
          roast_level: initialData.roast_level,
          amount_grams: initialData.amount_grams,
          bag_count: initialData.bag_count || 1,
          total_price: initialData.total_price || 0,
          origin_notes: initialData.origin_notes || "",
          company_name: initialData.company_name || "",
          partner_id: initialData.partner_id || undefined,
        }
      : {
          customer_id: isB2B ? "B2B_AUTO" : "",
          inventory_id: undefined,
          preparation_method: "Whole Bean",
          roast_level: "Medium",
          amount_grams: 250,
          bag_count: 1,
          total_price: 0,
          origin_notes: "",
          company_name: "",
          partner_id: undefined,
        },
  });

  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const { data: partnersData } = usePartners();
  const partners = Array.isArray(partnersData) ? partnersData : [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const roastLossPercentage = settings?.roast_loss_percentage ?? 20;

  const handleCustomerCreated = (newCustomer: CustomerRecord) => {
    setCustomersList((prev) => [...prev, newCustomer]);
    setValue('customer_id', newCustomer.id, { shouldValidate: true });
    setIsCreatingCustomer(false);
  };

  const onSubmit = (data: OrderFormValues) => {
    const payload = {
      customer_id: data.customer_id,
      preparation_method: data.preparation_method,
      roast_level: data.roast_level,
      amount_grams: data.amount_grams,
      total_price: data.total_price,
      origin_notes: data.origin_notes || null,
      inventory_id: data.inventory_id || null,
      bag_count: data.bag_count,
      company_name: data.company_name || null,
      partner_id: data.partner_id || null,
    };

    const onMutationSuccess = () => {
      toast.success(initialData?.id ? 'Order updated successfully' : 'Order created successfully');
      if (onSuccess) onSuccess();
      if (!onSuccess && !initialData) {
        reset();
      }
    };

    const onMutationError = (err: Error) => {
      toast.error(err.message || "Failed to save order");
    };

    if (initialData?.id) {
      updateMutation.mutate(
        { id: initialData.id, params: payload },
        { onSuccess: onMutationSuccess, onError: onMutationError }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: onMutationSuccess,
        onError: onMutationError,
      });
    }
  };

  const title = initialData?.id ? t('order_form_edit') : t('order_form_new');

  const footer = (
    <>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="text-expresso"
        >
          {t('cancel')}
        </Button>
      )}
      <Button
        type="submit"
        disabled={isPending}
        className="bg-coffee-fruit hover:bg-warm-roast text-white"
      >
        {isPending
          ? t('loading')
          : initialData?.id
            ? t('order_form_update')
            : t('order_form_create')}
      </Button>
    </>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <FormCard title={title} footer={footer}>
        {isCreatingCustomer ? (
            <div className="mt-2">
              <CustomerForm
                inline={true}
                onSuccess={handleCustomerCreated}
                onCancel={() => setIsCreatingCustomer(false)}
              />
            </div>
        ) : null}

        {!isB2B && (
          <div className="space-y-2">
            <Label htmlFor="customer_id" className="text-expresso font-bold tracking-tight">
              {t('order_form_customer')} *
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Controller
                  name="customer_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className={`bg-white-pergamino border-warm-roast/20 focus:ring-coffee-fruit h-12 rounded-xl transition-all ${errors.customer_id ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent className="bg-white-pergamino border-warm-roast/10 rounded-xl overflow-hidden shadow-xl">
                        {customersList.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="focus:bg-warm-roast/5 focus:text-coffee-fruit cursor-pointer rounded-lg m-1">
                            <span className="font-medium">{c.full_name}</span>
                            {c.company_name && <span className="text-xs text-expresso/60 ml-2">({c.company_name})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.customer_id && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.customer_id.message}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatingCustomer(true)}
                className="h-12 px-4 border-warm-roast/20 text-coffee-fruit hover:bg-warm-roast/5 rounded-xl font-medium"
              >
                New
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="inventory_id" className="text-expresso">
            {t('order_form_coffee_bean')} <span className="text-expresso/50 font-normal text-xs ml-1">{t('order_form_optional')}</span>
          </Label>
          <Controller
            control={control}
            name="inventory_id"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                disabled={!!initialData?.id}
              >
                <SelectTrigger className="w-full border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue placeholder={t('order_form_select_bean')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('order_form_none_manual')}</SelectItem>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name} — {(item.stock_grams / 1000).toFixed(2)} {t('order_form_raw_stock')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {!initialData?.id && (
            <p className="text-xs text-expresso/60">
              {t('order_form_deduct_info').replace('{loss}', roastLossPercentage.toString())}
            </p>
          )}
          {initialData?.id && (
            <p className="text-xs text-orange-600/80">
              {t('order_form_inventory_warning')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preparation_method" className="text-expresso">
              {t('order_form_preparation')} <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="preparation_method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder={t('order_form_select_method')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PREPARATION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {t(method.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.preparation_method && <p className="text-red-500 text-xs font-medium">{errors.preparation_method.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roast_level" className="text-expresso">
              {t('order_form_roast_level')} <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="roast_level"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder={t('order_form_select_roast')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ROAST_LEVELS.map((roast) => (
                      <SelectItem key={roast.value} value={roast.value}>
                        {t(roast.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.roast_level && <p className="text-red-500 text-xs font-medium">{errors.roast_level.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount_grams" className="text-expresso">
              {t('order_form_amount')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount_grams"
              type="number"
              placeholder="e.g. 2000"
              {...register('amount_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
            />
            {errors.amount_grams && <p className="text-red-500 text-xs font-medium">{errors.amount_grams.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bag_count" className="text-expresso">
              {t('order_bag_count')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bag_count"
              type="number"
              min="1"
              step="1"
              {...register('bag_count', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
            />
            {errors.bag_count && <p className="text-red-500 text-xs font-medium">{errors.bag_count.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_price" className="text-expresso">
              {t('order_form_total_price')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="total_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('total_price', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
            />
            {errors.total_price && <p className="text-red-500 text-xs font-medium">{errors.total_price.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin_notes" className="text-expresso">
              {t('order_form_origin_notes')}
            </Label>
            <Input
              id="origin_notes"
              placeholder={t('order_form_origin_notes_placeholder')}
              {...register('origin_notes')}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
            />
          </div>

          {isB2B && (
            <div className="space-y-4 col-span-2 mt-2">
              <div className="space-y-2 border border-warm-roast/10 bg-warm-roast/5 p-4 rounded-xl">
                <Label htmlFor="partner_id" className="text-expresso font-bold">
                  Link to Connected Partner <span className="text-xs text-expresso/50 font-normal ml-1">(Optional)</span>
                </Label>
                <p className="text-xs text-expresso/70 mb-2">If you select a partner, they will be able to see this order in their dashboard.</p>
                <Controller
                  control={control}
                  name="partner_id"
                  render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={(val) => {
                      field.onChange(val === "none" ? "" : val)
                      if (val !== "none") {
                        const selectedPartner = partners.find(p => p.id === val)
                        if (selectedPartner) {
                          setValue('company_name', selectedPartner.company_name)
                        }
                      }
                    }}>
                      <SelectTrigger className="w-full bg-white border-warm-roast/30 focus:ring-coffee-fruit">
                        <SelectValue placeholder="Select a connected partner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Partner (Manual Entry)</SelectItem>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-expresso">
                  Company Name <span className="text-xs text-expresso/50 font-normal ml-1">(Will be filled automatically if partner selected)</span>
                </Label>
                <Input
                  id="company_name"
                  placeholder="e.g. Central Perk Cafe"
                  {...register('company_name', { required: 'Company name is required for B2B orders' })}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
                />
                {errors.company_name && <p className="text-red-500 text-xs font-medium">{errors.company_name.message}</p>}
              </div>
            </div>
          )}
        </div>
      </FormCard>
    </form>
  );
}
