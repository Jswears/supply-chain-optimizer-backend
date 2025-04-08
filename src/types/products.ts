// Products Types
export interface Product {
  product_name: string;
  warehouse_id: string;
  stock_level: number;
  reorder_threshold: number;
  supplier: string;
  category: string;
  product_id: string;
  last_updated?: string;
}

export type ProductsResponse = {
  success: boolean;
  data: {
    message: string;
    data: Product[];
    pagination: null | {
      next_offset: object;
    };
  };
  timestamp: string;
};
