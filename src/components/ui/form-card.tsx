import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

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
    <Wrapper className={inline ? "space-y-4 p-4 border border-dashed border-warm-roast/30 rounded-lg bg-expresso/5" : "w-full shadow-lg border-warm-roast/20 flex flex-col max-h-[85vh] sm:max-h-[90vh]"}>
      <HeaderWrapper className={inline ? "pb-2 border-b border-warm-roast/10 mb-4" : "bg-white-pergamino border-b border-warm-roast/10 px-6 py-5 m-0 shrink-0"}>
        <CardTitle className={`${inline ? "text-lg" : "text-xl"} font-heading text-expresso`}>
          {title}
        </CardTitle>
      </HeaderWrapper>
      
      <ContentWrapper className={inline ? "space-y-3" : "space-y-4 px-6 pb-6 pt-4 m-0 overflow-y-auto flex-1"}>
        {children}
      </ContentWrapper>
      
      {footer && (
        <FooterWrapper className={inline ? "flex justify-end gap-2 mt-4" : "flex justify-end gap-3 border-t border-warm-roast/10 bg-expresso/5 p-4 m-0 shrink-0"}>
          {footer}
        </FooterWrapper>
      )}
    </Wrapper>
  )
}
