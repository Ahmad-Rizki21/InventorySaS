import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';

interface LowStockTableProps {
  data: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
      sku: string;
      category: string;
      unit: string;
    };
  }>;
}

export function LowStockTable({ data }: LowStockTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Stock Alert</CardTitle>
        <CardDescription>Items with stock below threshold</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No low stock items</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell>{item.product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.product.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.quantity < 5 ? 'destructive' : 'secondary'}>
                      {item.quantity < 5 ? 'Critical' : 'Low'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
