export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      buyers: {
        Row: {
          billing_address: string | null
          buyer_code: string
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          credit_limit: number | null
          delivery_address: string | null
          email: string | null
          gst_no: string | null
          id: string
          is_active: boolean | null
          payment_terms: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          buyer_code: string
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          delivery_address?: string | null
          email?: string | null
          gst_no?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          buyer_code?: string
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          delivery_address?: string | null
          email?: string | null
          gst_no?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          bank_account_no: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          city: string | null
          company_name: string
          created_at: string
          email: string | null
          gst_no: string | null
          id: string
          logo_url: string | null
          pan_no: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          terms_conditions: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          gst_no?: string | null
          id?: string
          logo_url?: string | null
          pan_no?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          gst_no?: string | null
          id?: string
          logo_url?: string | null
          pan_no?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          current_stock: number | null
          default_supplier_id: string | null
          description: string | null
          discount_percent: number | null
          hsn_code: string | null
          id: string
          name: string
          product_code: string
          purchase_price: number | null
          reorder_level: number | null
          selling_price: number | null
          status: Database["public"]["Enums"]["product_status"] | null
          tax_percent: number | null
          unit: Database["public"]["Enums"]["unit_type"] | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          default_supplier_id?: string | null
          description?: string | null
          discount_percent?: number | null
          hsn_code?: string | null
          id?: string
          name: string
          product_code: string
          purchase_price?: number | null
          reorder_level?: number | null
          selling_price?: number | null
          status?: Database["public"]["Enums"]["product_status"] | null
          tax_percent?: number | null
          unit?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          default_supplier_id?: string | null
          description?: string | null
          discount_percent?: number | null
          hsn_code?: string | null
          id?: string
          name?: string
          product_code?: string
          purchase_price?: number | null
          reorder_level?: number | null
          selling_price?: number | null
          status?: Database["public"]["Enums"]["product_status"] | null
          tax_percent?: number | null
          unit?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_supplier_id_fkey"
            columns: ["default_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          product_id: string
          purchase_id: string
          quantity: number
          tax_amount: number | null
          tax_percent: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          product_id: string
          purchase_id: string
          quantity: number
          tax_amount?: number | null
          tax_percent?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          product_id?: string
          purchase_id?: string
          quantity?: number
          tax_amount?: number | null
          tax_percent?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          bill_image_url: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          purchase_date: string
          purchase_number: string
          subtotal: number | null
          supplier_id: string
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          bill_image_url?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          purchase_date?: string
          purchase_number: string
          subtotal?: number | null
          supplier_id: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          bill_image_url?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          purchase_date?: string
          purchase_number?: string
          subtotal?: number | null
          supplier_id?: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          tax_amount: number | null
          tax_percent: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          tax_amount?: number | null
          tax_percent?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          tax_amount?: number | null
          tax_percent?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          buyer_id: string
          cgst_amount: number | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          dispatch_date: string | null
          grand_total: number | null
          id: string
          igst_amount: number | null
          invoice_number: string
          is_gst_invoice: boolean | null
          lr_no: string | null
          notes: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"] | null
          round_off: number | null
          sale_date: string
          sgst_amount: number | null
          subtotal: number | null
          total_amount: number | null
          transport_charges: number | null
          transport_mode: Database["public"]["Enums"]["transport_mode"] | null
          updated_at: string
          vehicle_no: string | null
        }
        Insert: {
          buyer_id: string
          cgst_amount?: number | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          dispatch_date?: string | null
          grand_total?: number | null
          id?: string
          igst_amount?: number | null
          invoice_number: string
          is_gst_invoice?: boolean | null
          lr_no?: string | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          round_off?: number | null
          sale_date?: string
          sgst_amount?: number | null
          subtotal?: number | null
          total_amount?: number | null
          transport_charges?: number | null
          transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
          updated_at?: string
          vehicle_no?: string | null
        }
        Update: {
          buyer_id?: string
          cgst_amount?: number | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          dispatch_date?: string | null
          grand_total?: number | null
          id?: string
          igst_amount?: number | null
          invoice_number?: string
          is_gst_invoice?: boolean | null
          lr_no?: string | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          round_off?: number | null
          sale_date?: string
          sgst_amount?: number | null
          subtotal?: number | null
          total_amount?: number | null
          transport_charges?: number | null
          transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
          updated_at?: string
          vehicle_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          bank_account_no: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          email: string | null
          gst_no: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          pan_no: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          supplier_code: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_no?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pan_no?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          supplier_code: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_no?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pan_no?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          supplier_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          id: string
          quotation_number: string
          buyer_id: string
          quotation_date: string
          valid_until: string
          reference_no: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number | null
          cgst_amount: number | null
          sgst_amount: number | null
          igst_amount: number | null
          discount_amount: number | null
          total_amount: number | null
          round_off: number | null
          grand_total: number | null
          notes: string | null
          terms_conditions: string | null
          is_gst_quotation: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quotation_number: string
          buyer_id: string
          quotation_date?: string
          valid_until: string
          reference_no?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number | null
          cgst_amount?: number | null
          sgst_amount?: number | null
          igst_amount?: number | null
          discount_amount?: number | null
          total_amount?: number | null
          round_off?: number | null
          grand_total?: number | null
          notes?: string | null
          terms_conditions?: string | null
          is_gst_quotation?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quotation_number?: string
          buyer_id?: string
          quotation_date?: string
          valid_until?: string
          reference_no?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number | null
          cgst_amount?: number | null
          sgst_amount?: number | null
          igst_amount?: number | null
          discount_amount?: number | null
          total_amount?: number | null
          round_off?: number | null
          grand_total?: number | null
          notes?: string | null
          terms_conditions?: string | null
          is_gst_quotation?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          id: string
          quotation_id: string
          product_id: string
          quantity: number
          unit_price: number
          tax_percent: number | null
          tax_amount: number | null
          discount_percent: number | null
          discount_amount: number | null
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          quotation_id: string
          product_id: string
          quantity: number
          unit_price: number
          tax_percent?: number | null
          tax_amount?: number | null
          discount_percent?: number | null
          discount_amount?: number | null
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          quotation_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          tax_percent?: number | null
          tax_amount?: number | null
          discount_percent?: number | null
          discount_amount?: number | null
          total_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
      payment_mode: "Cash" | "UPI" | "NEFT" | "Credit" | "Cheque"
      product_status: "active" | "inactive"
      quotation_status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
      transport_mode: "Road" | "Courier" | "Pickup" | "Rail" | "Air"
      unit_type: "PCS" | "BOX" | "KG" | "MTR" | "LTR" | "SET" | "PAIR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      payment_mode: ["Cash", "UPI", "NEFT", "Credit", "Cheque"],
      product_status: ["active", "inactive"],
      transport_mode: ["Road", "Courier", "Pickup", "Rail", "Air"],
      unit_type: ["PCS", "BOX", "KG", "MTR", "LTR", "SET", "PAIR"],
    },
  },
} as const
