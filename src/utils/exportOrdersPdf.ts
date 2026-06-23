import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import type { OrderWithCustomer, UserSettingsRecord, FulfillmentStatus } from '@/types'
import type { DictionaryKey } from '@/i18n/dictionaries'

type Translate = (key: DictionaryKey) => string

// Brand colors (RGB) — mirrors the tokens in the dos-tazas styling guide.
// Raw values are fine here: this draws into a PDF canvas, not JSX.
const EXPRESSO: [number, number, number] = [65, 5, 5] // #410505
const WARM_ROAST: [number, number, number] = [122, 19, 24] // #7a1318
const COFFEE_FRUIT: [number, number, number] = [185, 35, 35] // #b92323
const PERGAMINO: [number, number, number] = [255, 245, 225] // #fff5e1

// Fulfillment sections in the order a roaster works through them. Delivered
// orders reaching the PDF are unpaid by definition (the dashboard excludes
// delivered + paid orders).
const STATUS_SECTIONS: { status: FulfillmentStatus; titleKey: DictionaryKey }[] = [
  { status: 'pending', titleKey: 'orders_pending' },
  { status: 'roasted', titleKey: 'orders_roasted' },
  { status: 'delivered', titleKey: 'orders_delivered' },
]

const dash = (value: string | null | undefined) => (value && value.trim() ? value : '—')

/**
 * Generates and downloads a roasting work list PDF for the given orders.
 * Expects the dashboard's filtered set (pending, roasted, delivered-unpaid).
 */
export function exportOrdersPdf(
  orders: OrderWithCustomer[],
  settings: UserSettingsRecord | undefined,
  t: Translate,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 40

  // --- Header ---------------------------------------------------------------
  const businessName = settings?.business_name?.trim() || 'Dos Tazas'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...EXPRESSO)
  doc.text(businessName, marginX, 50)

  doc.setFontSize(13)
  doc.setTextColor(...COFFEE_FRUIT)
  doc.text(t('orders_pdf_title'), marginX, 70)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...WARM_ROAST)
  const generated = `${t('orders_pdf_generated')}: ${new Date().toLocaleString()}`
  doc.text(generated, pageWidth - marginX, 50, { align: 'right' })

  let cursorY = 90

  if (orders.length === 0) {
    doc.setFontSize(11)
    doc.setTextColor(...EXPRESSO)
    doc.text(t('orders_pdf_empty'), marginX, cursorY)
    doc.save(fileName())
    return
  }

  // --- Production summary (aggregated by variety + roast + grind) ------------
  type Agg = { variety: string; roast: string; grind: string; grams: number; count: number }
  const aggMap = new Map<string, Agg>()
  for (const o of orders) {
    const variety = o.inventory?.item_name || t('order_cost_na')
    const roast = o.roast_level || '—'
    const grind = o.preparation_method || '—'
    const key = `${variety}|${roast}|${grind}`
    const existing = aggMap.get(key)
    if (existing) {
      existing.grams += Number(o.amount_grams) || 0
      existing.count += 1
    } else {
      aggMap.set(key, { variety, roast, grind, grams: Number(o.amount_grams) || 0, count: 1 })
    }
  }
  const aggRows = Array.from(aggMap.values()).sort(
    (a, b) => a.variety.localeCompare(b.variety) || a.roast.localeCompare(b.roast),
  )
  const totalGrams = aggRows.reduce((sum, r) => sum + r.grams, 0)

  cursorY = sectionHeading(doc, t('orders_pdf_summary'), marginX, cursorY)

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [[
      t('orders_pdf_variety'),
      t('orders_pdf_roast'),
      t('orders_pdf_grind'),
      t('orders_pdf_total'),
      t('orders_pdf_count'),
    ]],
    body: aggRows.map((r) => [r.variety, r.roast, r.grind, `${r.grams}`, `${r.count}`]),
    foot: [['', '', t('orders_pdf_total'), `${totalGrams}`, `${orders.length}`]],
    theme: 'striped',
    headStyles: { fillColor: WARM_ROAST, textColor: PERGAMINO, fontStyle: 'bold' },
    footStyles: { fillColor: EXPRESSO, textColor: PERGAMINO, fontStyle: 'bold' },
    bodyStyles: { textColor: EXPRESSO },
    alternateRowStyles: { fillColor: [250, 243, 233] },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  })
  cursorY = lastY(doc) + 24

  // --- Detailed sections per status -----------------------------------------
  for (const { status, titleKey } of STATUS_SECTIONS) {
    const sectionOrders = orders.filter((o) => o.fulfillment_status === status)
    if (sectionOrders.length === 0) continue

    cursorY = sectionHeading(doc, `${t(titleKey)} (${sectionOrders.length})`, marginX, cursorY)

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [[
        t('orders_pdf_customer'),
        t('orders_pdf_variety'),
        t('orders_pdf_roast'),
        t('orders_pdf_grind'),
        t('orders_pdf_amount'),
        t('orders_pdf_date'),
        t('orders_pdf_payment'),
      ]],
      body: sectionOrders.map((o) => [
        dash(o.customers?.full_name) === '—' ? t('order_unknown_customer') : o.customers.full_name,
        dash(o.inventory?.item_name),
        dash(o.roast_level),
        dash(o.preparation_method),
        `${Number(o.amount_grams) || 0}`,
        new Date(o.order_date).toLocaleDateString(),
        o.payment_status === 'paid' ? t('order_paid') : t('order_unpaid'),
      ]),
      theme: 'grid',
      headStyles: { fillColor: COFFEE_FRUIT, textColor: PERGAMINO, fontStyle: 'bold' },
      bodyStyles: { textColor: EXPRESSO },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 4: { halign: 'right' } },
    })
    cursorY = lastY(doc) + 24
  }

  doc.save(fileName())
}

function sectionHeading(doc: jsPDF, text: string, x: number, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...EXPRESSO)
  doc.text(text, x, y)
  return y + 8
}

function lastY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

function fileName(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `roasting-worklist-${today}.pdf`
}
