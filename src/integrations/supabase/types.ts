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
      daily_completions: {
        Row: {
          completed_stack_id: string | null
          completion_date: string
          created_at: string
          drills_completed: number
          games_completed: number
          id: string
          lesson_completed: boolean
          market_id: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_stack_id?: string | null
          completion_date?: string
          created_at?: string
          drills_completed?: number
          games_completed?: number
          id?: string
          lesson_completed?: boolean
          market_id: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_stack_id?: string | null
          completion_date?: string
          created_at?: string
          drills_completed?: number
          games_completed?: number
          id?: string
          lesson_completed?: boolean
          market_id?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_completions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      drills_progress: {
        Row: {
          average_time_seconds: number | null
          completed_count: number | null
          correct_count: number | null
          created_at: string
          drill_type: string
          id: string
          last_completed_at: string | null
          market_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_time_seconds?: number | null
          completed_count?: number | null
          correct_count?: number | null
          created_at?: string
          drill_type: string
          id?: string
          last_completed_at?: string | null
          market_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_time_seconds?: number | null
          completed_count?: number | null
          correct_count?: number | null
          created_at?: string
          drill_type?: string
          id?: string
          last_completed_at?: string | null
          market_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drills_progress_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      games_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          game_type: string
          id: string
          level: number | null
          market_id: string
          progress_data: Json | null
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          game_type: string
          id?: string
          level?: number | null
          market_id: string
          progress_data?: Json | null
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          game_type?: string
          id?: string
          level?: number | null
          market_id?: string
          progress_data?: Json | null
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_progress_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          scenario_id: string
          selected_option: number
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          scenario_id: string
          selected_option: number
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          scenario_id?: string
          selected_option?: number
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_attempts_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "investment_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_lab_progress: {
        Row: {
          certified_at: string | null
          created_at: string
          due_diligence_score: number | null
          id: string
          investment_certified: boolean | null
          investment_xp: number | null
          market_id: string
          paper_trades_completed: number | null
          portfolio_construction_score: number | null
          risk_assessment_score: number | null
          simulation_accuracy: number | null
          thesis_submissions: number | null
          updated_at: string
          user_id: string
          valuation_score: number | null
          watchlist_companies: Json | null
        }
        Insert: {
          certified_at?: string | null
          created_at?: string
          due_diligence_score?: number | null
          id?: string
          investment_certified?: boolean | null
          investment_xp?: number | null
          market_id: string
          paper_trades_completed?: number | null
          portfolio_construction_score?: number | null
          risk_assessment_score?: number | null
          simulation_accuracy?: number | null
          thesis_submissions?: number | null
          updated_at?: string
          user_id: string
          valuation_score?: number | null
          watchlist_companies?: Json | null
        }
        Update: {
          certified_at?: string | null
          created_at?: string
          due_diligence_score?: number | null
          id?: string
          investment_certified?: boolean | null
          investment_xp?: number | null
          market_id?: string
          paper_trades_completed?: number | null
          portfolio_construction_score?: number | null
          risk_assessment_score?: number | null
          simulation_accuracy?: number | null
          thesis_submissions?: number | null
          updated_at?: string
          user_id?: string
          valuation_score?: number | null
          watchlist_companies?: Json | null
        }
        Relationships: []
      }
      investment_scenarios: {
        Row: {
          correct_option_index: number
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          market_id: string
          options: Json
          question: string
          real_world_example: string | null
          scenario: string
          scenario_type: string
          tags: string[] | null
          title: string
          valuation_model: string | null
        }
        Insert: {
          correct_option_index: number
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          market_id: string
          options?: Json
          question: string
          real_world_example?: string | null
          scenario: string
          scenario_type: string
          tags?: string[] | null
          title: string
          valuation_model?: string | null
        }
        Update: {
          correct_option_index?: number
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          market_id?: string
          options?: Json
          question?: string
          real_world_example?: string | null
          scenario?: string
          scenario_type?: string
          tags?: string[] | null
          title?: string
          valuation_model?: string | null
        }
        Relationships: []
      }
      markets: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      news_items: {
        Row: {
          category_tag: string | null
          created_at: string
          id: string
          image_url: string | null
          market_id: string
          published_at: string
          source_name: string
          source_url: string
          stack_id: string | null
          summary: string | null
          title: string
        }
        Insert: {
          category_tag?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          market_id: string
          published_at?: string
          source_name: string
          source_url: string
          stack_id?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          category_tag?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          market_id?: string
          published_at?: string
          source_name?: string
          source_url?: string
          stack_id?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_items_stack_id_fkey"
            columns: ["stack_id"]
            isOneToOne: false
            referencedRelation: "stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          linked_label: string | null
          market_id: string | null
          slide_id: string | null
          stack_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          linked_label?: string | null
          market_id?: string | null
          slide_id?: string | null
          stack_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          linked_label?: string | null
          market_id?: string | null
          slide_id?: string | null
          stack_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "slides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_stack_id_fkey"
            columns: ["stack_id"]
            isOneToOne: false
            referencedRelation: "stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          notification_preferences: Json | null
          push_token: string | null
          selected_market: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          notification_preferences?: Json | null
          push_token?: string | null
          selected_market?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          notification_preferences?: Json | null
          push_token?: string | null
          selected_market?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_market_fkey"
            columns: ["selected_market"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_insights: {
        Row: {
          content: string | null
          created_at: string
          id: string
          slide_id: string | null
          stack_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          slide_id?: string | null
          stack_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          slide_id?: string | null
          stack_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_insights_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "slides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_insights_stack_id_fkey"
            columns: ["stack_id"]
            isOneToOne: false
            referencedRelation: "stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      slides: {
        Row: {
          body: string
          created_at: string
          id: string
          slide_number: number
          sources: Json | null
          stack_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          slide_number: number
          sources?: Json | null
          stack_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          slide_number?: number
          sources?: Json | null
          stack_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "slides_stack_id_fkey"
            columns: ["stack_id"]
            isOneToOne: false
            referencedRelation: "stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      stacks: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          market_id: string
          published_at: string | null
          stack_type: string
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          market_id: string
          published_at?: string | null
          stack_type: string
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          market_id?: string
          published_at?: string | null
          stack_type?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stacks_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          content: string
          created_at: string
          for_date: string
          id: string
          key_takeaways: Json | null
          market_id: string
          summary_type: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          for_date: string
          id?: string
          key_takeaways?: Json | null
          market_id: string
          summary_type: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          for_date?: string
          id?: string
          key_takeaways?: Json | null
          market_id?: string
          summary_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          scenario_id: string
          selected_option: number
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          scenario_id: string
          selected_option: number
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          scenario_id?: string
          selected_option?: number
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_attempts_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "trainer_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_scenarios: {
        Row: {
          correct_option_index: number
          created_at: string
          feedback_common_mistake: string | null
          feedback_mental_model: string | null
          feedback_pro_reasoning: string | null
          follow_up_question: string | null
          id: string
          market_id: string
          options: Json
          question: string
          scenario: string
          sources: Json | null
          tags: string[] | null
        }
        Insert: {
          correct_option_index: number
          created_at?: string
          feedback_common_mistake?: string | null
          feedback_mental_model?: string | null
          feedback_pro_reasoning?: string | null
          follow_up_question?: string | null
          id?: string
          market_id: string
          options?: Json
          question: string
          scenario: string
          sources?: Json | null
          tags?: string[] | null
        }
        Update: {
          correct_option_index?: number
          created_at?: string
          feedback_common_mistake?: string | null
          feedback_mental_model?: string | null
          feedback_pro_reasoning?: string | null
          follow_up_question?: string | null
          id?: string
          market_id?: string
          options?: Json
          question?: string
          scenario?: string
          sources?: Json | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_scenarios_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_stacks: string[] | null
          created_at: string
          current_day: number | null
          current_streak: number | null
          id: string
          last_activity_at: string | null
          longest_streak: number | null
          market_id: string
          streak_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_stacks?: string[] | null
          created_at?: string
          current_day?: number | null
          current_streak?: number | null
          id?: string
          last_activity_at?: string | null
          longest_streak?: number | null
          market_id: string
          streak_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_stacks?: string[] | null
          created_at?: string
          current_day?: number | null
          current_streak?: number | null
          id?: string
          last_activity_at?: string | null
          longest_streak?: number | null
          market_id?: string
          streak_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          created_at: string
          current_level: number
          id: string
          market_id: string
          startup_stage: number
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          created_at?: string
          current_level?: number
          id?: string
          market_id: string
          startup_stage?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          created_at?: string
          current_level?: number
          id?: string
          market_id?: string
          startup_stage?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          market_id: string
          source_id: string | null
          source_type: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          market_id: string
          source_id?: string | null
          source_type: string
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          market_id?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_level: { Args: { xp: number }; Returns: number }
      calculate_startup_stage: { Args: { xp: number }; Returns: number }
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
