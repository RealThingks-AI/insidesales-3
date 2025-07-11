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
          contact_name: string | null
          contact_owner: string | null
          contact_source: Database["public"]["Enums"]["contact_source"] | null
          country: string | null
          created_by: string
          created_time: string
          description: string | null
          email: string | null
          fax: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          interest: string | null
          lead_status: Database["public"]["Enums"]["lead_status"] | null
          linkedin: string | null
          mobile_no: string | null
          modified_by: string | null
          modified_time: string
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
          contact_name?: string | null
          contact_owner?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_by: string
          created_time?: string
          description?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          interest?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string
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
          contact_name?: string | null
          contact_owner?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_by?: string
          created_time?: string
          description?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          interest?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string
          no_of_employees?: number | null
          phone_no?: string | null
          position?: string | null
          state?: string | null
          website?: string | null
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
          confirmation_note: string | null
          created_at: string
          created_by: string
          currency: string | null
          customer_agreed_on_need: string | null
          customer_need_identified: boolean | null
          deal_name: string
          decision_expected_date: string | null
          decision_maker_present: boolean | null
          decision_makers: string | null
          description: string | null
          discussion_notes: string | null
          drop_reason: string | null
          drop_summary: string | null
          execution_started: boolean | null
          expected_deal_timeline_end: string | null
          expected_deal_timeline_start: string | null
          id: string
          internal_notes: string | null
          last_activity_time: string | null
          learning_summary: string | null
          loss_reason: string | null
          lost_reason: string | null
          lost_to: string | null
          modified_at: string
          modified_by: string | null
          nda_signed: boolean | null
          need_summary: string | null
          negotiation_notes: string | null
          negotiation_status: string | null
          offer_sent_date: string | null
          probability: number | null
          product_service_scope: string | null
          proposal_sent_date: string | null
          related_lead_id: string | null
          related_meeting_id: string | null
          revised_offer_notes: string | null
          rfq_confirmation_note: string | null
          rfq_document_link: string | null
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
          confirmation_note?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          customer_agreed_on_need?: string | null
          customer_need_identified?: boolean | null
          deal_name: string
          decision_expected_date?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          discussion_notes?: string | null
          drop_reason?: string | null
          drop_summary?: string | null
          execution_started?: boolean | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_time?: string | null
          learning_summary?: string | null
          loss_reason?: string | null
          lost_reason?: string | null
          lost_to?: string | null
          modified_at?: string
          modified_by?: string | null
          nda_signed?: boolean | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          offer_sent_date?: string | null
          probability?: number | null
          product_service_scope?: string | null
          proposal_sent_date?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          revised_offer_notes?: string | null
          rfq_confirmation_note?: string | null
          rfq_document_link?: string | null
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
          confirmation_note?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          customer_agreed_on_need?: string | null
          customer_need_identified?: boolean | null
          deal_name?: string
          decision_expected_date?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          discussion_notes?: string | null
          drop_reason?: string | null
          drop_summary?: string | null
          execution_started?: boolean | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_time?: string | null
          learning_summary?: string | null
          loss_reason?: string | null
          lost_reason?: string | null
          lost_to?: string | null
          modified_at?: string
          modified_by?: string | null
          nda_signed?: boolean | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          offer_sent_date?: string | null
          probability?: number | null
          product_service_scope?: string | null
          proposal_sent_date?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          revised_offer_notes?: string | null
          rfq_confirmation_note?: string | null
          rfq_document_link?: string | null
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
      lead_conversions: {
        Row: {
          contact_id: string | null
          conversion_notes: string | null
          converted_by: string
          created_at: string
          id: string
          lead_id: string | null
        }
        Insert: {
          contact_id?: string | null
          conversion_notes?: string | null
          converted_by: string
          created_at?: string
          id?: string
          lead_id?: string | null
        }
        Update: {
          contact_id?: string | null
          conversion_notes?: string | null
          converted_by?: string
          created_at?: string
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_conversions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_conversions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          annual_revenue: number | null
          city: string | null
          company_name: string | null
          contact_owner: string | null
          contact_source: Database["public"]["Enums"]["contact_source"] | null
          country: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          fax: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          lead_name: string | null
          lead_status: Database["public"]["Enums"]["lead_status"] | null
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
          contact_owner?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_name?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
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
          contact_owner?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          lead_name?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
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
      login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_time: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_time?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_time?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string
          date: string
          description: string | null
          duration: string
          id: string
          location: string
          meeting_title: string
          participants: string[]
          start_time: string
          teams_link: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          duration: string
          id?: string
          location: string
          meeting_title: string
          participants?: string[]
          start_time: string
          teams_link?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          duration?: string
          id?: string
          location?: string
          meeting_title?: string
          participants?: string[]
          start_time?: string
          teams_link?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          module_id: string | null
          module_type: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          module_id?: string | null
          module_type?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          module_id?: string | null
          module_type?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          "Email ID": string | null
          full_name: string
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name: string
          id: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          email: string
          id: string
          invited_at: string
          invited_by: string | null
          module_access: Json | null
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          module_access?: Json | null
          role?: string
          status?: string | null
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          module_access?: Json | null
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          phone_number: string | null
          profile_picture_url: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          phone_number?: string | null
          profile_picture_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          phone_number?: string | null
          profile_picture_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_stage_completion: {
        Args: { deal_id: string; current_stage: string }
        Returns: boolean
      }
      create_user_profile: {
        Args: {
          user_id: string
          display_name: string
          email: string
          user_role?: string
        }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      call_status: "Scheduled" | "Completed" | "Cancelled" | "No Answer"
      contact_source:
        | "Website"
        | "Referral"
        | "Social Media"
        | "Email"
        | "Phone"
        | "Advertisement"
        | "Trade Show"
        | "Other"
      deal_stage:
        | "Contact"
        | "Lead"
        | "Meeting"
        | "Qualified"
        | "RFQ"
        | "Offered"
        | "Won"
        | "Lost"
        | "Dropped"
      email_status:
        | "Sent"
        | "Delivered"
        | "Bounce"
        | "Opened"
        | "Replied"
        | "No Response"
      industry_type:
        | "Technology"
        | "Healthcare"
        | "Finance"
        | "Education"
        | "Manufacturing"
        | "Retail"
        | "Real Estate"
        | "Consulting"
        | "Other"
        | "Automotive"
      lead_source:
        | "Website"
        | "Phone"
        | "Email"
        | "Referral"
        | "Advertisement"
        | "Trade Show"
        | "Social Media"
        | "Other"
      lead_status:
        | "New"
        | "Qualified"
        | "Contacted"
        | "Proposal"
        | "Negotiation"
        | "Won"
        | "Lost"
      meeting_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      priority_level: "Low" | "Medium" | "High" | "Critical"
      task_status: "Not Started" | "In Progress" | "Completed" | "Cancelled"
      topic_status: "Open" | "Done"
      user_role: "admin" | "member"
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
      call_status: ["Scheduled", "Completed", "Cancelled", "No Answer"],
      contact_source: [
        "Website",
        "Referral",
        "Social Media",
        "Email",
        "Phone",
        "Advertisement",
        "Trade Show",
        "Other",
      ],
      deal_stage: [
        "Contact",
        "Lead",
        "Meeting",
        "Qualified",
        "RFQ",
        "Offered",
        "Won",
        "Lost",
        "Dropped",
      ],
      email_status: [
        "Sent",
        "Delivered",
        "Bounce",
        "Opened",
        "Replied",
        "No Response",
      ],
      industry_type: [
        "Technology",
        "Healthcare",
        "Finance",
        "Education",
        "Manufacturing",
        "Retail",
        "Real Estate",
        "Consulting",
        "Other",
        "Automotive",
      ],
      lead_source: [
        "Website",
        "Phone",
        "Email",
        "Referral",
        "Advertisement",
        "Trade Show",
        "Social Media",
        "Other",
      ],
      lead_status: [
        "New",
        "Qualified",
        "Contacted",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
      ],
      meeting_status: ["scheduled", "in_progress", "completed", "cancelled"],
      priority_level: ["Low", "Medium", "High", "Critical"],
      task_status: ["Not Started", "In Progress", "Completed", "Cancelled"],
      topic_status: ["Open", "Done"],
      user_role: ["admin", "member"],
    },
  },
} as const
