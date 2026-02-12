import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface StockChartProps {
  data: Array<{
    name: string;
    stockLevel: number;
    availableItems?: number;
    deployedItems?: number;
  }>;
}

export function StockChart({ data }: StockChartProps) {
  // Ensure data is an array before using it
  const chartData = Array.isArray(data) ? data.slice(0, 10) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Levels</CardTitle>
        <CardDescription>Current stock levels by product</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 0, right: 0, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  interval={0}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-md text-xs">
                          <p className="font-bold mb-1">{payload[0].payload.name}</p>
                          <div className="space-y-1">
                            <p className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Total:</span>
                              <span className="font-mono font-bold text-primary">{payload[0].value}</span>
                            </p>
                            {payload[0].payload.availableItems !== undefined && (
                              <p className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Gudang:</span>
                                <span className="font-mono text-emerald-500">{payload[0].payload.availableItems}</span>
                              </p>
                            )}
                            {payload[0].payload.deployedItems !== undefined && (
                              <p className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Terpasang:</span>
                                <span className="font-mono text-blue-500">{payload[0].payload.deployedItems}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="stockLevel"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                >
                  <LabelList
                    dataKey="stockLevel"
                    position="top"
                    fontSize={12}
                    fontWeight="bold"
                    fill="hsl(var(--foreground))"
                    offset={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center text-center text-muted-foreground">
            <p className="text-sm">Belum ada data stok yang tersedia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
