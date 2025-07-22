export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          cftc_code: string | null
          first_date: string | null
          id: string
          last_date: string | null
          name: string
          sector: string
        }
        Insert: {
          cftc_code?: string | null
          first_date?: string | null
          id?: string
          last_date?: string | null
          name: string
          sector?: string
        }
        Update: {
          cftc_code?: string | null
          first_date?: string | null
          id?: string
          last_date?: string | null
          name?: string
          sector?: string
        }
        Relationships: []
      }
      cot_metrics: {
        Row: {
          comm_index: number | null
          comm_net: number | null
          contract_id: string | null
          id: number
          ls_index: number | null
          ls_net: number | null
          report_date: string
          ss_index: number | null
          ss_net: number | null
          wow_comm_delta: number | null
          wow_ls_delta: number | null
          wow_ss_delta: number | null
        }
        Insert: {
          comm_index?: number | null
          comm_net?: number | null
          contract_id?: string | null
          id?: number
          ls_index?: number | null
          ls_net?: number | null
          report_date: string
          ss_index?: number | null
          ss_net?: number | null
          wow_comm_delta?: number | null
          wow_ls_delta?: number | null
          wow_ss_delta?: number | null
        }
        Update: {
          comm_index?: number | null
          comm_net?: number | null
          contract_id?: string | null
          id?: number
          ls_index?: number | null
          ls_net?: number | null
          report_date?: string
          ss_index?: number | null
          ss_net?: number | null
          wow_comm_delta?: number | null
          wow_ls_delta?: number | null
          wow_ss_delta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cot_metrics_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      cot_weekly: {
        Row: {
          comm_long: number | null
          comm_short: number | null
          contract_id: string | null
          id: number
          ls_long: number | null
          ls_short: number | null
          open_interest: number | null
          prod_class: string | null
          report_date: string
          ss_long: number | null
          ss_short: number | null
        }
        Insert: {
          comm_long?: number | null
          comm_short?: number | null
          contract_id?: string | null
          id?: number
          ls_long?: number | null
          ls_short?: number | null
          open_interest?: number | null
          prod_class?: string | null
          report_date: string
          ss_long?: number | null
          ss_short?: number | null
        }
        Update: {
          comm_long?: number | null
          comm_short?: number | null
          contract_id?: string | null
          id?: number
          ls_long?: number | null
          ls_short?: number | null
          open_interest?: number | null
          prod_class?: string | null
          report_date?: string
          ss_long?: number | null
          ss_short?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cot_weekly_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_log: {
        Row: {
          error: string | null
          id: number
          rows_inserted: number | null
          rows_updated: number | null
          run_at: string | null
        }
        Insert: {
          error?: string | null
          id?: number
          rows_inserted?: number | null
          rows_updated?: number | null
          run_at?: string | null
        }
        Update: {
          error?: string | null
          id?: number
          rows_inserted?: number | null
          rows_updated?: number | null
          run_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      cot_latest: {
        Row: {
          comm_index: number | null
          comm_net: number | null
          contract_id: string | null
          id: number | null
          ls_index: number | null
          ls_net: number | null
          report_date: string | null
          ss_index: number | null
          ss_net: number | null
          wow_comm_delta: number | null
          wow_ls_delta: number | null
          wow_ss_delta: number | null
        }
        Insert: {
          comm_index?: number | null
          comm_net?: number | null
          contract_id?: string | null
          id?: number | null
          ls_index?: number | null
          ls_net?: number | null
          report_date?: string | null
          ss_index?: number | null
          ss_net?: number | null
          wow_comm_delta?: number | null
          wow_ls_delta?: number | null
          wow_ss_delta?: number | null
        }
        Update: {
          comm_index?: number | null
          comm_net?: number | null
          contract_id?: string | null
          id?: number | null
          ls_index?: number | null
          ls_net?: number | null
          report_date?: string | null
          ss_index?: number | null
          ss_net?: number | null
          wow_comm_delta?: number | null
          wow_ls_delta?: number | null
          wow_ss_delta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cot_metrics_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
