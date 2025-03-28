// Inventory types
export interface Product {
  product_id: string;
  warehouse_id: string;
  product_name: string;
  stock_level: number;
  reorder_threshold: number;
  supplier: string;
  category: string;
  last_updated?: string;
}

// Order types
export interface Order {
  order_id?: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_at?: string;
}
