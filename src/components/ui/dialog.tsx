"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeButtonClassName,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  closeButtonClassName?: string
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Shared.
          "fixed z-50 grid w-full gap-4 bg-popover p-4 text-sm text-popover-foreground outline-none",
          // Centred dialog — what every width from `sm` up keeps.
          "top-1/2 left-1/2 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl ring-1 ring-foreground/10 duration-100 sm:max-w-sm",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          // Below `sm` the same popup is a bottom sheet: unpinned from the centre,
          // stuck to the bottom edge, full bleed.
          "max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-none max-sm:translate-none",
          "max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-warm-roast/10 max-sm:shadow-lg max-sm:shadow-warm-roast/10 max-sm:ring-0",
          // dvh, not vh: it tracks the visible viewport, so the sheet is never taller
          // than the screen while the browser chrome is showing.
          "max-sm:max-h-[90dvh] max-sm:overflow-y-auto max-sm:overscroll-contain",
          "max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]",
          // Slide up from the edge instead of zooming in from the middle.
          "max-sm:duration-200 max-sm:data-open:zoom-in-100 max-sm:data-closed:zoom-out-100 max-sm:data-open:slide-in-from-bottom-full max-sm:data-closed:slide-out-to-bottom-full",
          // A sheet opened from inside another insets so the parent's edge stays visible.
          "max-sm:data-nested:mx-2 max-sm:data-nested:mb-2 max-sm:data-nested:rounded-b-2xl",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className={cn("absolute top-3.5 right-3.5 text-muted-foreground/75 hover:text-foreground hover:bg-muted/50", closeButtonClassName)}
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {/* Sheet grabber. It lives here rather than on DialogContent so it never
          floats on the backdrop of a modal that switches off its own chrome. */}
      <div
        aria-hidden="true"
        className="mx-auto mb-1 h-1.5 w-10 shrink-0 rounded-full bg-warm-roast/20 sm:hidden"
      />
      {children}
    </div>
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        // In a sheet the actions stay put while the body scrolls, and clear the
        // home indicator. The negative margin has to match DialogContent's padding.
        "max-sm:sticky max-sm:bottom-0 max-sm:rounded-b-none max-sm:-mb-[max(1rem,env(safe-area-inset-bottom))] max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]",
        // Full-width, comfortable actions on a phone.
        "max-sm:[&>button]:w-full max-sm:[&>button]:min-h-11",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
