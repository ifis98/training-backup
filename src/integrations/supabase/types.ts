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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_alerts: {
        Row: {
          admin_notes: string
          assigned_to: string | null
          body: string
          created_at: string
          dedupe_key: string | null
          follow_up_at: string | null
          id: string
          next_step: string
          practice_id: string | null
          resolved_at: string | null
          severity: string
          status: string
          target_user_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          assigned_to?: string | null
          body?: string
          created_at?: string
          dedupe_key?: string | null
          follow_up_at?: string | null
          id?: string
          next_step?: string
          practice_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          target_user_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          assigned_to?: string | null
          body?: string
          created_at?: string
          dedupe_key?: string | null
          follow_up_at?: string | null
          id?: string
          next_step?: string
          practice_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          target_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_alerts_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_to: string | null
          case_value: number
          created_at: string
          id: string
          notes: string
          patient_name: string
          practice_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          case_value?: number
          created_at?: string
          id?: string
          notes?: string
          patient_name?: string
          practice_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          case_value?: number
          created_at?: string
          id?: string
          notes?: string
          patient_name?: string
          practice_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          admin_notes: string
          created_at: string
          email: string
          goals: string[] | null
          guard_price: number | null
          guards_per_month: number | null
          has_scanner: boolean | null
          id: string
          message: string
          monthly_patients: number | null
          name: string
          operatories: number | null
          phone: string
          practice_name: string
          practice_size: string | null
          scanner_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          email: string
          goals?: string[] | null
          guard_price?: number | null
          guards_per_month?: number | null
          has_scanner?: boolean | null
          id?: string
          message?: string
          monthly_patients?: number | null
          name: string
          operatories?: number | null
          phone?: string
          practice_name?: string
          practice_size?: string | null
          scanner_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          created_at?: string
          email?: string
          goals?: string[] | null
          guard_price?: number | null
          guards_per_month?: number | null
          has_scanner?: boolean | null
          id?: string
          message?: string
          monthly_patients?: number | null
          name?: string
          operatories?: number | null
          phone?: string
          practice_name?: string
          practice_size?: string | null
          scanner_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      practice_goals: {
        Row: {
          created_at: string
          id: string
          monthly_case_goal: number
          monthly_revenue_goal: number
          practice_id: string
          price_per_case: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_case_goal?: number
          monthly_revenue_goal?: number
          practice_id: string
          price_per_case?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_case_goal?: number
          monthly_revenue_goal?: number
          practice_id?: string
          price_per_case?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_goals_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: true
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_schedule: {
        Row: {
          closed_days: string[]
          created_at: string
          holidays: string[]
          id: string
          practice_id: string
          updated_at: string
        }
        Insert: {
          closed_days?: string[]
          created_at?: string
          holidays?: string[]
          id?: string
          practice_id: string
          updated_at?: string
        }
        Update: {
          closed_days?: string[]
          created_at?: string
          holidays?: string[]
          id?: string
          practice_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_schedule_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: true
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practices: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          practice_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          practice_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          practice_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          last_seen_at: string | null
          practice_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
          practice_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
          practice_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          practice_name: string
          rep_name: string
          status: string
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          practice_name: string
          rep_name?: string
          status?: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          practice_name?: string
          rep_name?: string
          status?: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      simulation_reviews: {
        Row: {
          created_at: string
          id: string
          improvements: string[]
          modules_to_review: string[]
          overall_feedback: string
          practice_id: string | null
          score: number
          score_label: string
          session_number: number
          strengths: string[]
          tips: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          improvements?: string[]
          modules_to_review?: string[]
          overall_feedback?: string
          practice_id?: string | null
          score?: number
          score_label?: string
          session_number?: number
          strengths?: string[]
          tips?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          improvements?: string[]
          modules_to_review?: string[]
          overall_feedback?: string
          practice_id?: string | null
          score?: number
          score_label?: string
          session_number?: number
          strengths?: string[]
          tips?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_reviews_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          practice_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          practice_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          practice_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      support_bookings: {
        Row: {
          admin_notes: string
          assigned_to: string | null
          booking_date: string
          booking_time: string
          created_at: string
          email: string
          follow_up_at: string | null
          id: string
          name: string
          notes: string
          status: string
          triage_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string
          assigned_to?: string | null
          booking_date: string
          booking_time: string
          created_at?: string
          email?: string
          follow_up_at?: string | null
          id?: string
          name?: string
          notes?: string
          status?: string
          triage_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string
          assigned_to?: string | null
          booking_date?: string
          booking_time?: string
          created_at?: string
          email?: string
          follow_up_at?: string | null
          id?: string
          name?: string
          notes?: string
          status?: string
          triage_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          baseline_score: number | null
          completed_at: string | null
          created_at: string
          done_modules: string[]
          id: string
          intake_done: boolean
          name: string
          practice: string
          practice_id: string | null
          signed: boolean
          sim_patients: number
          training_roles: string[]
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          baseline_score?: number | null
          completed_at?: string | null
          created_at?: string
          done_modules?: string[]
          id?: string
          intake_done?: boolean
          name?: string
          practice?: string
          practice_id?: string | null
          signed?: boolean
          sim_patients?: number
          training_roles?: string[]
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          baseline_score?: number | null
          completed_at?: string | null
          created_at?: string
          done_modules?: string[]
          id?: string
          intake_done?: boolean
          name?: string
          practice?: string
          practice_id?: string | null
          signed?: boolean
          sim_patients?: number
          training_roles?: string[]
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_practice_code: { Args: never; Returns: string }
      generate_registration_code: { Args: never; Returns: string }
      get_user_practice_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_registration_code: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
      validate_registration_code: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "staff" | "bytesense_admin"
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
      app_role: ["admin", "staff", "bytesense_admin"],
    },
  },
} as const
