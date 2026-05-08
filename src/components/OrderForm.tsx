"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { createOrder, updateOrder } from "@/actions/orders";
import { CustomerForm } from "@/components/CustomerForm";
import type { CustomerRecord, OrderInsertParams, InventoryRecord, UserSettingsRecord } from "@/types";

interface OrderFormProps {
  customers: CustomerRecord[];
  inventoryItems?: InventoryRecord[];
  settings?: UserSettingsRecord;
  initialData?: OrderInsertParams & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PREPARATION_METHODS = [
  "Whole Bean",
  "V60",
  "French Press",
  "Espresso",
  "Aeropress",
  "Moka Pot",
];
const ROAST_LEVELS = ["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"];

export function OrderForm({
  customers: initialCustomers,
  inventoryItems = [],
  settings,
  initialData,
  onSuccess,
  onCancel,
}: OrderFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customersList, setCustomersList] = useState(initialCustomers);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const [customerId, setCustomerId] = useState(initialData?.customer_id || "");
  const [inventoryId, setInventoryId] = useState(initialData?.inventory_id || "");
  const [prepMethod, setPrepMethod] = useState(
    initialData?.preparation_method || "",
  );
  const [roastLevel, setRoastLevel] = useState(initialData?.roast_level || "");
  const [amountGrams, setAmountGrams] = useState<number | "">(
    initialData?.amount_grams || "",
  );
  const [totalPrice, setTotalPrice] = useState<number | "">(
    initialData?.total_price || "",
  );
  const [originNotes, setOriginNotes] = useState(
    initialData?.origin_notes || "",
  );

  const roastLossPercentage = settings?.roast_loss_percentage ?? 20;

  const handleCustomerCreated = (newCustomer: CustomerRecord) => {
    setCustomersList((prev) => [...prev, newCustomer]);
    setCustomerId(newCustomer.id);
    setIsCreatingCustomer(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !customerId ||
      !prepMethod ||
      !roastLevel ||
      !amountGrams ||
      !totalPrice
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        const orderData = {
          customer_id: customerId,
          preparation_method: prepMethod,
          roast_level: roastLevel,
          amount_grams: Number(amountGrams),
          total_price: Number(totalPrice),
          origin_notes: originNotes || null,
          inventory_id: inventoryId || null,
        }

        if (initialData?.id) {
          await updateOrder(initialData.id, orderData)
        } else {
          await createOrder(orderData)
        }

        if (onSuccess) onSuccess();

        if (!onSuccess) {
          setCustomerId("");
          setPrepMethod("");
          setRoastLevel("");
          setAmountGrams("");
          setTotalPrice("");
          setOriginNotes("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save order");
      }
    });
  };

  return (
    <Card className="w-full shadow-lg border-warm-roast/20">
      <CardHeader className="bg-white-pergamino border-b border-warm-roast/10 px-6 py-5 m-0">
        <CardTitle className="text-xl font-heading text-expresso">
          {initialData?.id ? "Edit Order" : "New Order"}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex flex-col">
        <CardContent className="space-y-4 px-6 pb-6 pt-4 m-0">
          {error && (
            <div className="text-red-500 text-sm font-medium">{error}</div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="customer_id" className="text-expresso">
                Customer
              </Label>
              <button
                type="button"
                onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
                className="text-xs font-semibold text-coffee-fruit hover:text-warm-roast transition-colors"
              >
                {isCreatingCustomer
                  ? "Cancel New Customer"
                  : "+ Add New Customer"}
              </button>
            </div>

            {isCreatingCustomer ? (
              <div className="mt-2">
                <CustomerForm
                  inline={true}
                  onSuccess={handleCustomerCreated}
                  onCancel={() => setIsCreatingCustomer(false)}
                />
              </div>
            ) : customersList.length > 0 ? (
              <Select
                value={customerId}
                onValueChange={(val) => setCustomerId(val || "")}
                required
              >
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customersList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                      {c.phone ? ` — ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-expresso/60 border border-dashed border-warm-roast/20 rounded-md p-3 text-center">
                No customers yet. Click &quot;+ Add New Customer&quot; to create
                one.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory_id" className="text-expresso">
              Coffee Bean (Inventory) <span className="text-expresso/50 font-normal text-xs ml-1">(Optional)</span>
            </Label>
            <Select
              value={inventoryId}
              onValueChange={(val) => setInventoryId(val === "none" || !val ? "" : val)}
              disabled={!!initialData?.id}
            >
              <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                <SelectValue placeholder="Select coffee bean to deduct from inventory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Manual Entry)</SelectItem>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name} — {(item.stock_grams / 1000).toFixed(2)}kg raw stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!initialData?.id && (
              <p className="text-xs text-expresso/60">
                If selected, the amount of grams will be automatically deducted from your raw stock (including {roastLossPercentage}% roasting loss) upon creation.
              </p>
            )}
            {initialData?.id && (
              <p className="text-xs text-orange-600/80">
                Inventory source cannot be changed after order creation.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preparation_method" className="text-expresso">
                Preparation
              </Label>
              <Select
                value={prepMethod}
                onValueChange={(val) => setPrepMethod(val || "")}
                required
              >
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PREPARATION_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roast_level" className="text-expresso">
                Roast Level
              </Label>
              <Select
                value={roastLevel}
                onValueChange={(val) => setRoastLevel(val || "")}
                required
              >
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue placeholder="Select roast" />
                </SelectTrigger>
                <SelectContent>
                  {ROAST_LEVELS.map((roast) => (
                    <SelectItem key={roast} value={roast}>
                      {roast}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount_grams" className="text-expresso">
                Amount (grams)
              </Label>
              <Input
                id="amount_grams"
                type="number"
                placeholder="e.g. 2000"
                value={amountGrams}
                onChange={(e) =>
                  setAmountGrams(e.target.value ? Number(e.target.value) : "")
                }
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_price" className="text-expresso">
                Total Price ($)
              </Label>
              <Input
                id="total_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={totalPrice}
                onChange={(e) =>
                  setTotalPrice(e.target.value ? Number(e.target.value) : "")
                }
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin_notes" className="text-expresso">
              Origin Notes (Farmer Recognition)
            </Label>
            <Input
              id="origin_notes"
              placeholder="e.g. Finca El Paraiso, Diego Bermudez"
              value={originNotes}
              onChange={(e) => setOriginNotes(e.target.value)}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t border-warm-roast/10 bg-expresso/5 p-4 m-0">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              className="text-expresso"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="bg-coffee-fruit hover:bg-warm-roast text-white"
          >
            {isPending
              ? "Saving..."
              : initialData?.id
                ? "Update Order"
                : "Create Order"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
