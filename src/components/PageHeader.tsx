'use client'

import React from 'react'

interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="min-w-0">
        {/* Titan One never goes below 18px; 26px is the phone step of the 30px
            page title, so a long business name still fits on one line. */}
        <h1 className="text-[26px] leading-8 sm:text-3xl font-heading text-expresso">{title}</h1>
        {subtitle && (
          <p className="text-expresso/70 font-medium text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-2 max-sm:w-full">
          {action}
        </div>
      )}
    </div>
  )
}
