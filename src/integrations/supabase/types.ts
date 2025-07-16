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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          annual_revenue: number | null
          city: string | null
          company_name: string | null
          contact_name: string
          contact_owner: string | null
          contact_source: string | null
          country: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          lead_status: string | null
          linkedin: string | null
          mobile_no: string | null
          modified_by: string | null
          modified_time: string | null
          no_of_employees: number | null
          phone_no: string | null
          position: string | null
          state: string | null
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          city?: string | null
          company_name?: string | null
          contact_name: string
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          no_of_employees?: number | null
          phone_no?: string | null
          position?: string | null
          state?: string | null
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          city?: string | null
          company_name?: string | null
          contact_name?: string
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          no_of_employees?: number | null
          phone_no?: string | null
          position?: string | null
          state?: string | null
          website?: string | null
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          card_order: Json | null
          created_at: string | null
          id: string
          layout_view: string | null
          updated_at: string | null
          user_id: string
          visible_widgets: Json | null
        }
        Insert: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id: string
          visible_widgets?: Json | null
        }
        Update: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id?: string
          visible_widgets?: Json | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount: number | null
          begin_execution_date: string | null
          budget_confirmed: string | null
          budget_holder: string | null
          closing_date: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_agreed_on_need: string | null
          customer_need_identified: boolean | null
          deal_name: string
          decision_expected_date: string | null
          decision_maker_present: boolean | null
          decision_makers: string | null
          description: string | null
          drop_reason: string | null
          execution_started: boolean | null
          expected_deal_timeline_end: string | null
          expected_deal_timeline_start: string | null
          id: string
          internal_notes: string | null
          loss_reason: string | null
          modified_at: string | null
          modified_by: string | null
          nda_signed: boolean | null
          need_summary: string | null
          negotiation_notes: string | null
          negotiation_status: string | null
          probability: number | null
          product_service_scope: string | null
          proposal_sent_date: string | null
          related_lead_id: string | null
          related_meeting_id: string | null
          rfq_confirmation_note: string | null
          rfq_document_url: string | null
          rfq_value: number | null
          stage: string
          supplier_portal_access: string | null
          supplier_portal_required: boolean | null
          timeline: string | null
          win_reason: string | null
        }
        Insert: {
          amount?: number | null
          begin_execution_date?: string | null
          budget_confirmed?: string | null
          budget_holder?: string | null
          closing_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_agreed_on_need?: string | null
          customer_need_identified?: boolean | null
          deal_name: string
          decision_expected_date?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          drop_reason?: string | null
          execution_started?: boolean | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          id?: string
          internal_notes?: string | null
          loss_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          nda_signed?: boolean | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          probability?: number | null
          product_service_scope?: string | null
          proposal_sent_date?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          rfq_confirmation_note?: string | null
          rfq_document_url?: string | null
          rfq_value?: number | null
          stage?: string
          supplier_portal_access?: string | null
          supplier_portal_required?: boolean | null
          timeline?: string | null
          win_reason?: string | null
        }
        Update: {
          amount?: number | null
          begin_execution_date?: string | null
          budget_confirmed?: string | null
          budget_holder?: string | null
          closing_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_agreed_on_need?: string | null
          customer_need_identified?: boolean | null
          deal_name?: string
          decision_expected_date?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          drop_reason?: string | null
          execution_started?: boolean | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          id?: string
          internal_notes?: string | null
          loss_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          nda_signed?: boolean | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          probability?: number | null
          product_service_scope?: string | null
          proposal_sent_date?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          rfq_confirmation_note?: string | null
          rfq_document_url?: string | null
          rfq_value?: number | null
          stage?: string
          supplier_portal_access?: string | null
          supplier_portal_required?: boolean | null
          timeline?: string | null
          win_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_related_meeting_id_fkey"
            columns: ["related_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          company_name: string | null
          contact_owner: string | null
          contact_source: string | null
          country: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          lead_name: string
          lead_status: string | null
          linkedin: string | null
          mobile_no: string | null
          modified_by: string | null
          modified_time: string | null
          phone_no: string | null
          position: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name: string
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name?: string
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Relationships: []
      }
      meeting_outcomes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          interested_in_deal: boolean
          meeting_id: string
          next_steps: string | null
          outcome_type: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean
          meeting_id: string
          next_steps?: string | null
          outcome_type: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean
          meeting_id?: string
          next_steps?: string | null
          outcome_type?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_outcomes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          duration: string | null
          id: string
          location: string | null
          meeting_id: string | null
          meeting_title: string
          participants: string[] | null
          start_time: string
          teams_link: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          meeting_id?: string | null
          meeting_title: string
          participants?: string[] | null
          start_time: string
          teams_link?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          meeting_id?: string | null
          meeting_title?: string
          participants?: string[] | null
          start_time?: string
          teams_link?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          "Email ID": string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
