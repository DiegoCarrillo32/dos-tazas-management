import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * "bare" hands the surface to the child — a <FormCard/> that draws its own
 * header, scrolling body and footer. The popup then contributes only position,
 * size and the mobile sheet behaviour.
 */
const BARE_CONTENT = "p-0 border-none bg-transparent shadow-none ring-0 gap-0 overflow-hidden"

export interface GenericModalProps {
  isOpen?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  hideFooter?: boolean
  hideTitle?: boolean
  contentClassName?: string
  showCloseButton?: boolean
  /**
   * "dialog" (default) — the popup is the surface: chrome, padding, footer.
   * "bare" — the child owns the surface. Implies hideTitle and hideFooter; the
   * title is still rendered for screen readers.
   */
  variant?: "dialog" | "bare"
}

export function GenericModal({
  isOpen,
  onClose,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  onConfirm,
  confirmText,
  cancelText = "Cancel",
  confirmVariant = "default",
  hideFooter = false,
  hideTitle = false,
  contentClassName,
  showCloseButton = false,
  variant = "dialog",
}: GenericModalProps) {
  const isAlert = !onConfirm
  const isBare = variant === "bare"
  const noTitle = hideTitle || isBare
  const noFooter = hideFooter || isBare

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open)
    if (!open && onClose) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (React.isValidElement(trigger) ? <DialogTrigger render={trigger} /> : <DialogTrigger>{trigger}</DialogTrigger>)}
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(isBare && BARE_CONTENT, contentClassName)}
      >
        {(!noTitle && (title || description)) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {noTitle && title && <DialogTitle className="sr-only">{title}</DialogTitle>}
        {children && (isBare ? children : <div className="py-2 text-sm text-foreground">{children}</div>)}
        {!noFooter && (
          <DialogFooter>
            {isAlert ? (
              <Button onClick={() => handleOpenChange(false)}>{confirmText || "OK"}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  {cancelText}
                </Button>
                <Button variant={confirmVariant} onClick={() => {
                  if (onConfirm) onConfirm()
                  handleOpenChange(false)
                }}>
                  {confirmText || "Confirm"}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
