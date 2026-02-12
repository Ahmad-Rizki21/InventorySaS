import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryChartProps {
  data: Array<{
    category: string;
    productCount: number;
    itemCount: number;
  }>;
}

const COLORS = {
  'Active': 'hsl(217, 91%, 60%)',
  'Passive': 'hsl(142, 76%, 36%)',
  'Tool': 'hsl(38, 92%, 50%)',
};

export function CategoryChart({ data }: CategoryChartProps) {
  // Transform data for pie chart
  const chartData = data.map((item) => ({
    name: item.category,
    value: item.itemCount,
    productCount: item.productCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items by Category</CardTitle>
        <CardDescription>Distribution of items across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
