import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FormCardProps {
  inline?: boolean
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function FormCard({ inline = false, title, children, footer }: FormCardProps) {
  const Wrapper = inline ? 'div' : Card
  const HeaderWrapper = inline ? 'div' : CardHeader
  const ContentWrapper = inline ? 'div' : CardContent
  const FooterWrapper = inline ? 'div' : CardFooter

  return (
    <Wrapper
      className={cn(
        inline
          ? "space-y-4 p-4 border border-dashed border-warm-roast/30 rounded-lg bg-expresso/5"
          : cn(
              "w-full shadow-lg border-warm-roast/20 flex flex-col",
              // dvh rather than vh: on iOS vh measures the *largest* viewport, so an
              // 85vh card can be taller than what the user can actually see.
              "max-h-[85dvh] sm:max-h-[90dvh]",
              // Below `sm` this card is itself the bottom sheet, so it squares off at
              // the bottom and drops its side borders to sit flush with the screen.
              "max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0 max-sm:shadow-none"
            )
      )}
    >
      <HeaderWrapper
        className={cn(
          inline
            ? "pb-2 border-b border-warm-roast/10 mb-4"
            : "bg-white-pergamino border-b border-warm-roast/10 px-6 py-5 m-0 shrink-0 max-sm:px-4 max-sm:py-4 max-sm:rounded-t-2xl"
        )}
      >
        <CardTitle className={cn("font-heading text-expresso", inline ? "text-lg" : "text-xl")}>
          {title}
        </CardTitle>
      </HeaderWrapper>

      <ContentWrapper
        className={cn(
          inline
            ? "space-y-3"
            : "space-y-4 px-6 pb-6 pt-4 m-0 overflow-y-auto overscroll-contain flex-1 max-sm:px-4"
        )}
      >
        {children}
      </ContentWrapper>

      {footer && (
        <FooterWrapper
          className={cn(
            inline
              ? "flex justify-end gap-2 mt-4"
              : cn(
                  "flex justify-end gap-3 border-t border-warm-roast/10 bg-expresso/5 p-4 m-0 shrink-0",
                  // Clear the home indicator, and give the actions a real target size.
                  "max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>button]:flex-1 max-sm:[&>button]:min-h-11"
                )
          )}
        >
          {footer}
        </FooterWrapper>
      )}
    </Wrapper>
  )
}
