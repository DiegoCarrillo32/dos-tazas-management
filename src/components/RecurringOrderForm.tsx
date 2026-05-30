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
import { FormCard } from "@/components/ui/form-card";
import type { InventoryRecord, B2BRecurringOrderInsertParams, B2BRecurringOrderRecord } from "@/types";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useCreateRecurringOrder, useUpdateRecurringOrder } from '@/hooks/queries';
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
const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly (Every 2 weeks)" },
  { value: "monthly", label: "Monthly" },
];
const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const recurringSchema = z.object({
  inventory_id: z.string().optional(),
  preparation_method: z.string().min(1, 'Preparation method is required'),
  roast_level: z.string().min(1, 'Roast level is required'),
  amount_grams: z.number().min(1, 'Amount must be greater than 0'),
  bag_count: z.number().min(1, 'At least 1 bag required'),
  frequency: z.string().min(1, 'Frequency is required'),
  day_of_week: z.number().min(0).max(6),
});

type RecurringFormValues = z.infer<typeof recurringSchema>;

interface RecurringOrderFormProps {
  partnerId: string;
  inventoryItems?: InventoryRecord[];
  initialData?: B2BRecurringOrderRecord;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecurringOrderForm({
  partnerId,
  inventoryItems = [],
  initialData,
  onSuccess,
  onCancel,
}: RecurringOrderFormProps) {
  const { t } = useTranslation();

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      inventory_id: initialData?.inventory_id || '',
      preparation_method: initialData?.preparation_method || '',
      roast_level: initialData?.roast_level || '',
      amount_grams: initialData?.amount_grams ?? ('' as unknown as number),
      bag_count: initialData?.bag_count ?? 1,
      frequency: initialData?.frequency || 'weekly',
      day_of_week: initialData?.day_of_week ?? 1,
    }
  });

  const createMutation = useCreateRecurringOrder(partnerId);
  const updateMutation = useUpdateRecurringOrder(partnerId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: RecurringFormValues) => {
    const payload: B2BRecurringOrderInsertParams = {
      partner_id: partnerId,
      preparation_method: data.preparation_method,
      roast_level: data.roast_level,
      amount_grams: data.amount_grams,
      inventory_id: data.inventory_id || null,
      bag_count: data.bag_count,
      frequency: data.frequency,
      day_of_week: data.day_of_week,
      is_active: initialData?.is_active ?? true,
    };

    const onMutationSuccess = () => {
      toast.success(initialData?.id ? 'Recurring template updated' : 'Recurring template created');
      if (onSuccess) onSuccess();
      if (!onSuccess && !initialData) {
        reset();
      }
    };

    const onMutationError = (err: Error) => {
      toast.error(err.message || "Failed to save recurring template");
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

  const title = initialData?.id ? "Edit Standing Order" : "New Standing Order";

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
            ? "Save Changes"
            : "Create Template"}
      </Button>
    </>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <FormCard title={title} footer={footer}>
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
              >
                <SelectTrigger className="w-full border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue placeholder={t('order_form_select_bean')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standard Coffee (No specific bean)</SelectItem>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount_grams" className="text-expresso">
              {t('order_form_amount')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount_grams"
              type="number"
              placeholder="e.g. 5000"
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-expresso">
              Schedule <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.frequency && <p className="text-red-500 text-xs font-medium">{errors.frequency.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="day_of_week" className="text-expresso">
              Delivery Day <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="day_of_week"
              render={({ field }) => (
                <Select value={field.value.toString()} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger className="w-full border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.day_of_week && <p className="text-red-500 text-xs font-medium">{errors.day_of_week.message}</p>}
          </div>
        </div>
      </FormCard>
    </form>
  );
}
