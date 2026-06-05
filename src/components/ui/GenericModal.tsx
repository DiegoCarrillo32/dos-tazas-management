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
}: GenericModalProps) {
  const isAlert = !onConfirm

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open)
    if (!open && onClose) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (React.isValidElement(trigger) ? <DialogTrigger render={trigger} /> : <DialogTrigger>{trigger}</DialogTrigger>)}
      <DialogContent showCloseButton={showCloseButton} className={contentClassName}>
        {(!hideTitle && (title || description)) && (
          <DialogHeader>
            {title && <DialogTitle className={hideTitle ? "sr-only" : ""}>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {hideTitle && title && <DialogTitle className="sr-only">{title}</DialogTitle>}
        {children && <div className="py-2 text-sm text-foreground">{children}</div>}
        {!hideFooter && (
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
