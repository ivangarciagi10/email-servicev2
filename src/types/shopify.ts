export interface DraftOrder {
  id: number;
  name: string;
  email: string;
  note: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  customer?: Customer;
  line_items: LineItem[];
  shipping_address?: Address;
  billing_address?: Address;
  tags: string[];
  note_attributes: NoteAttribute[];
  admin_graphql_api_id: string;
  tax_lines: TaxLine[];
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  verified_email: boolean;
  created_at: string;
  updated_at: string;
  tags: string;
  note?: string;
  total_spent: string;
  orders_count: number;
  state: string;
  default_address?: Address;
  addresses: Address[];
  accepts_marketing: boolean;
  accepts_marketing_updated_at: string;
  marketing_opt_in_level?: string;
  tax_exempt: boolean;
  currency: string;
  admin_graphql_api_id: string;
  metafields?: Metafield[];
}

export interface LineItem {
  id: number;
  variant_id: number;
  title: string;
  quantity: number;
  sku: string;
  variant_title?: string;
  vendor?: string;
  fulfillment_service: string;
  product_id: number;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  variant_inventory_management: string;
  properties: any[];
  customAttributes?: CustomAttribute[];
  product_exists: boolean;
  fulfillable_quantity: number;
  grams: number;
  price: string;
  total_discount: string;
  fulfillment_status?: string;
  price_set: MoneySet;
  total_discount_set: MoneySet;
  discount_allocations: DiscountAllocation[];
  duties: any[];
  admin_graphql_api_id: string;
  tax_lines: TaxLine[];
}

export interface CustomAttribute {
  key: string;
  value: string;
}

export interface Address {
  id?: number;
  customer_id?: number;
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
  name: string;
  province_code: string;
  country_code: string;
  country_name: string;
  default?: boolean;
}

export interface NoteAttribute {
  name: string;
  value: string;
}

export interface TaxLine {
  price: string;
  rate: number;
  title: string;
  price_set: MoneySet;
}

export interface MoneySet {
  shop_money: Money;
  presentment_money: Money;
}

export interface Money {
  amount: string;
  currency_code: string;
}

export interface DiscountAllocation {
  amount: string;
  discount_application_index: number;
  amount_set: MoneySet;
}

export interface Metafield {
  id: number;
  namespace: string;
  key: string;
  value: string;
  value_type: string;
  description?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  owner_resource: string;
}

export interface Advisor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
}

export interface MetaobjectField {
  key: string;
  value: string;
  type: string;
}

export interface Metaobject {
  id: number;
  type: string;
  fields: MetaobjectField[];
  handle: string;
  created_at: string;
  updated_at: string;
  admin_graphql_api_id: string;
}

export interface ShopifyApiResponse<T> {
  data: T;
  errors?: any[];
} 