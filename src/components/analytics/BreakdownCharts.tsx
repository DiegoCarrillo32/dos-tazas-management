'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BreakdownItem } from '@/types'

const COLORS = ['#b92323', '#7a1318', '#410505', '#d45b5b', '#e88a8a', '#993333']

interface BreakdownChartProps {
  title: string
  data: BreakdownItem[]
  valueLabel?: string
}

function BreakdownChart({ title, data, valueLabel = 'grams' }: BreakdownChartProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-md border-warm-roast/10">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-expresso">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-expresso/50 text-sm">
            No data available.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-expresso">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#41050510" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#410505' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}kg`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12, fill: '#410505' }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff5e1',
                border: '1px solid #7a131830',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#410505'
              }}
              formatter={(value) => [
                `${(Number(value) / 1000).toFixed(2)} kg`,
                valueLabel === 'grams' ? 'Coffee Sold' : valueLabel
              ]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface BreakdownChartsProps {
  roastData: BreakdownItem[]
  prepData: BreakdownItem[]
}

export function BreakdownCharts({ roastData, prepData }: BreakdownChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BreakdownChart title="By Roast Level" data={roastData} />
      <BreakdownChart title="By Preparation Method" data={prepData} />
    </div>
  )
}
