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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vector: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vector?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vector?: string | null
        }
        Relationships: []
      }
      ikigai: {
        Row: {
          ai_summary: string | null
          created_at: string
          good_at_text: string | null
          id: string
          livelihood_text: string | null
          love_text: string | null
          updated_at: string
          user_id: string
          world_needs_text: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          good_at_text?: string | null
          id?: string
          livelihood_text?: string | null
          love_text?: string | null
          updated_at?: string
          user_id: string
          world_needs_text?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          good_at_text?: string | null
          id?: string
          livelihood_text?: string | null
          love_text?: string | null
          updated_at?: string
          user_id?: string
          world_needs_text?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          compatibility_score: number | null
          conversation_starters: string[] | null
          created_at: string
          id: string
          risk_flags: Json | null
          role_category: string | null
          strengths: string[] | null
          summary: string | null
          sustainability_score: number | null
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          compatibility_score?: number | null
          conversation_starters?: string[] | null
          created_at?: string
          id?: string
          risk_flags?: Json | null
          role_category?: string | null
          strengths?: string[] | null
          summary?: string | null
          sustainability_score?: number | null
          user_a_id: string
          user_b_id: string
        }
        Update: {
          compatibility_score?: number | null
          conversation_starters?: string[] | null
          created_at?: string
          id?: string
          risk_flags?: Json | null
          role_category?: string | null
          strengths?: string[] | null
          summary?: string | null
          sustainability_score?: number | null
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          connection_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          connection_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          connection_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      personality: {
        Row: {
          adaptability: string | null
          adaptability_other: string | null
          assertiveness: string | null
          assertiveness_other: string | null
          autonomy_level: string | null
          budget_philosophy: string[] | null
          commitment_consistency: string | null
          commitment_consistency_other: string | null
          commitment_type: string | null
          communication_depth: string | null
          communication_rhythm: string | null
          communication_style: string | null
          conflict_detail: string | null
          conflict_style: string | null
          created_at: string
          dealbreakers: string | null
          decision_speed: string | null
          decision_structure: string | null
          equity_expectations: string | null
          equity_expectations_other: string | null
          feedback_style: string | null
          feedback_style_detail: string | null
          feedback_style_other: string | null
          financial_runway: string | null
          id: string
          ideal_environment: string | null
          involvement_pref: string | null
          leadership_pref: string[] | null
          long_term_vision: string | null
          mission_priority: string | null
          mission_priority_detail: string | null
          motivation_style: string | null
          motivation_style_other: string | null
          non_negotiables: string | null
          ownership_style: string | null
          past_collab_exp: string | null
          past_collaboration: string | null
          recognition_style: string | null
          recognition_style_other: string | null
          relationship_style: string | null
          scope_clarity: string | null
          startup_readiness: string | null
          stress_response: string | null
          stress_response_other: string | null
          success_criteria: string | null
          timeline_style: string | null
          trust_style: string | null
          trust_style_other: string | null
          updated_at: string
          user_id: string
          vision_flexibility: string | null
          vision_flexibility_other: string | null
          work_life_balance: string | null
          work_life_balance_other: string | null
          working_style: string | null
          working_style_other: string | null
        }
        Insert: {
          adaptability?: string | null
          adaptability_other?: string | null
          assertiveness?: string | null
          assertiveness_other?: string | null
          autonomy_level?: string | null
          budget_philosophy?: string[] | null
          commitment_consistency?: string | null
          commitment_consistency_other?: string | null
          commitment_type?: string | null
          communication_depth?: string | null
          communication_rhythm?: string | null
          communication_style?: string | null
          conflict_detail?: string | null
          conflict_style?: string | null
          created_at?: string
          dealbreakers?: string | null
          decision_speed?: string | null
          decision_structure?: string | null
          equity_expectations?: string | null
          equity_expectations_other?: string | null
          feedback_style?: string | null
          feedback_style_detail?: string | null
          feedback_style_other?: string | null
          financial_runway?: string | null
          id?: string
          ideal_environment?: string | null
          involvement_pref?: string | null
          leadership_pref?: string[] | null
          long_term_vision?: string | null
          mission_priority?: string | null
          mission_priority_detail?: string | null
          motivation_style?: string | null
          motivation_style_other?: string | null
          non_negotiables?: string | null
          ownership_style?: string | null
          past_collab_exp?: string | null
          past_collaboration?: string | null
          recognition_style?: string | null
          recognition_style_other?: string | null
          relationship_style?: string | null
          scope_clarity?: string | null
          startup_readiness?: string | null
          stress_response?: string | null
          stress_response_other?: string | null
          success_criteria?: string | null
          timeline_style?: string | null
          trust_style?: string | null
          trust_style_other?: string | null
          updated_at?: string
          user_id: string
          vision_flexibility?: string | null
          vision_flexibility_other?: string | null
          work_life_balance?: string | null
          work_life_balance_other?: string | null
          working_style?: string | null
          working_style_other?: string | null
        }
        Update: {
          adaptability?: string | null
          adaptability_other?: string | null
          assertiveness?: string | null
          assertiveness_other?: string | null
          autonomy_level?: string | null
          budget_philosophy?: string[] | null
          commitment_consistency?: string | null
          commitment_consistency_other?: string | null
          commitment_type?: string | null
          communication_depth?: string | null
          communication_rhythm?: string | null
          communication_style?: string | null
          conflict_detail?: string | null
          conflict_style?: string | null
          created_at?: string
          dealbreakers?: string | null
          decision_speed?: string | null
          decision_structure?: string | null
          equity_expectations?: string | null
          equity_expectations_other?: string | null
          feedback_style?: string | null
          feedback_style_detail?: string | null
          feedback_style_other?: string | null
          financial_runway?: string | null
          id?: string
          ideal_environment?: string | null
          involvement_pref?: string | null
          leadership_pref?: string[] | null
          long_term_vision?: string | null
          mission_priority?: string | null
          mission_priority_detail?: string | null
          motivation_style?: string | null
          motivation_style_other?: string | null
          non_negotiables?: string | null
          ownership_style?: string | null
          past_collab_exp?: string | null
          past_collaboration?: string | null
          recognition_style?: string | null
          recognition_style_other?: string | null
          relationship_style?: string | null
          scope_clarity?: string | null
          startup_readiness?: string | null
          stress_response?: string | null
          stress_response_other?: string | null
          success_criteria?: string | null
          timeline_style?: string | null
          trust_style?: string | null
          trust_style_other?: string | null
          updated_at?: string
          user_id?: string
          vision_flexibility?: string | null
          vision_flexibility_other?: string | null
          work_life_balance?: string | null
          work_life_balance_other?: string | null
          working_style?: string | null
          working_style_other?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          core_skills: string[] | null
          created_at: string
          cv_url: string | null
          domain: string | null
          github_url: string | null
          id: string
          industries: string[] | null
          industry_other: string | null
          linkedin_url: string | null
          location_city: string | null
          location_country: string | null
          name: string | null
          phone: string | null
          photo_url: string | null
          portfolio_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          core_skills?: string[] | null
          created_at?: string
          cv_url?: string | null
          domain?: string | null
          github_url?: string | null
          id?: string
          industries?: string[] | null
          industry_other?: string | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          core_skills?: string[] | null
          created_at?: string
          cv_url?: string | null
          domain?: string | null
          github_url?: string | null
          id?: string
          industries?: string[] | null
          industry_other?: string | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      user_identity: {
        Row: {
          created_at: string
          id: string
          identity_type: string
          intent_types: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identity_type: string
          intent_types?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identity_type?: string
          intent_types?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_profiles: {
        Args: {
          exclude_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          similarity: number
          user_id: string
        }[]
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
