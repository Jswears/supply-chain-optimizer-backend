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

// Prediction types
export interface Prediction {
  date: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
}

export interface CSVRow {
  item_id: string;
  date: string;
  predicted_value: string;
  lower_bound: string;
  upper_bound: string;
}
