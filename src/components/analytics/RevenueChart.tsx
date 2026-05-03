'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RevenueDataPoint } from '@/types'

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-md border-warm-roast/10">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-expresso">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-expresso/50 text-sm">
            No data available for the selected period.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-warm-roast/10">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-expresso">Revenue Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b92323" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#b92323" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#41050510" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#410505' }}
              tickLine={false}
              axisLine={{ stroke: '#41050520' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#410505' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff5e1',
                border: '1px solid #7a131830',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#410505'
              }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#b92323"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
