import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-warm-roast/30 bg-white px-3 py-2 text-base text-expresso transition-colors outline-none placeholder:text-expresso/40 focus-visible:border-coffee-fruit focus-visible:ring-2 focus-visible:ring-coffee-fruit/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-warm-roast/5 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground dark:bg-input/30 dark:border-warm-roast/20 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
