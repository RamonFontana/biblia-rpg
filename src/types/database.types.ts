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
      character_items: {
        Row: {
          character_id: string
          created_at: string | null
          custom_condition_resistances: string[] | null
          id: string
          item_id: string
          level: number
          quantity: number | null
          weapon_effects: Json | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          custom_condition_resistances?: string[] | null
          id?: string
          item_id: string
          level?: number
          quantity?: number | null
          weapon_effects?: Json | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          custom_condition_resistances?: string[] | null
          id?: string
          item_id?: string
          level?: number
          quantity?: number | null
          weapon_effects?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "character_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          attributes: Json
          coins: number | null
          conditions: Json | null
          created_at: string
          death_saves_failures: number
          death_saves_successes: number
          equipment: Json | null
          fortress: string | null
          has_participated_in_session: boolean | null
          id: string
          inspiration_session_id: string | null
          inspiration_used_day: number | null
          is_dead: boolean
          is_deleted: boolean
          is_enemy: boolean
          is_npc: boolean | null
          is_stable: boolean
          is_visible: boolean
          level: number
          name: string
          narrative: Json | null
          pending_level_up: boolean
          proficiencies: Json | null
          skills: Json | null
          stats: Json
          temptation: string | null
          tribe: string
          updated_at: string
          user_id: string
          vocation: string
        }
        Insert: {
          attributes: Json
          coins?: number | null
          conditions?: Json | null
          created_at?: string
          death_saves_failures?: number
          death_saves_successes?: number
          equipment?: Json | null
          fortress?: string | null
          has_participated_in_session?: boolean | null
          id?: string
          inspiration_session_id?: string | null
          inspiration_used_day?: number | null
          is_dead?: boolean
          is_deleted?: boolean
          is_enemy?: boolean
          is_npc?: boolean | null
          is_stable?: boolean
          is_visible?: boolean
          level?: number
          name: string
          narrative?: Json | null
          pending_level_up?: boolean
          proficiencies?: Json | null
          skills?: Json | null
          stats: Json
          temptation?: string | null
          tribe: string
          updated_at?: string
          user_id: string
          vocation: string
        }
        Update: {
          attributes?: Json
          coins?: number | null
          conditions?: Json | null
          created_at?: string
          death_saves_failures?: number
          death_saves_successes?: number
          equipment?: Json | null
          fortress?: string | null
          has_participated_in_session?: boolean | null
          id?: string
          inspiration_session_id?: string | null
          inspiration_used_day?: number | null
          is_dead?: boolean
          is_deleted?: boolean
          is_enemy?: boolean
          is_npc?: boolean | null
          is_stable?: boolean
          is_visible?: boolean
          level?: number
          name?: string
          narrative?: Json | null
          pending_level_up?: boolean
          proficiencies?: Json | null
          skills?: Json | null
          stats?: Json
          temptation?: string | null
          tribe?: string
          updated_at?: string
          user_id?: string
          vocation?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_inspiration_session_id_fkey"
            columns: ["inspiration_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_attacks: {
        Row: {
          attacker_name: string
          attacker_participant_id: string
          combat_id: string
          created_at: string
          critical: boolean
          damage: number
          fumble: boolean
          hit: boolean
          id: string
          natural_roll: number
          target_ac: number
          target_hp_after: number
          target_hp_before: number
          target_name: string
          target_participant_id: string
          total: number
        }
        Insert: {
          attacker_name: string
          attacker_participant_id: string
          combat_id: string
          created_at?: string
          critical: boolean
          damage?: number
          fumble: boolean
          hit: boolean
          id?: string
          natural_roll: number
          target_ac: number
          target_hp_after: number
          target_hp_before: number
          target_name: string
          target_participant_id: string
          total: number
        }
        Update: {
          attacker_name?: string
          attacker_participant_id?: string
          combat_id?: string
          created_at?: string
          critical?: boolean
          damage?: number
          fumble?: boolean
          hit?: boolean
          id?: string
          natural_roll?: number
          target_ac?: number
          target_hp_after?: number
          target_hp_before?: number
          target_name?: string
          target_participant_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "combat_attacks_attacker_participant_id_fkey"
            columns: ["attacker_participant_id"]
            isOneToOne: false
            referencedRelation: "combat_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_attacks_combat_id_fkey"
            columns: ["combat_id"]
            isOneToOne: false
            referencedRelation: "combats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_attacks_target_participant_id_fkey"
            columns: ["target_participant_id"]
            isOneToOne: false
            referencedRelation: "combat_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_participants: {
        Row: {
          combat_id: string
          conditions: Json
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["combat_entity_type"]
          hp_current: number
          id: string
          initiative: number
          is_surprised: boolean
          updated_at: string
        }
        Insert: {
          combat_id: string
          conditions?: Json
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["combat_entity_type"]
          hp_current?: number
          id?: string
          initiative?: number
          is_surprised?: boolean
          updated_at?: string
        }
        Update: {
          combat_id?: string
          conditions?: Json
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["combat_entity_type"]
          hp_current?: number
          id?: string
          initiative?: number
          is_surprised?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combat_participants_combat_id_fkey"
            columns: ["combat_id"]
            isOneToOne: false
            referencedRelation: "combats"
            referencedColumns: ["id"]
          },
        ]
      }
      combats: {
        Row: {
          created_at: string
          current_turn_index: number
          id: string
          round_number: number
          session_id: string
          status: Database["public"]["Enums"]["combat_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_turn_index?: number
          id?: string
          round_number?: number
          session_id: string
          status?: Database["public"]["Enums"]["combat_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_turn_index?: number
          id?: string
          round_number?: number
          session_id?: string
          status?: Database["public"]["Enums"]["combat_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          current_day: number
          current_period: string
          description: string | null
          gm_id: string
          id: string
          last_long_rest_day: number | null
          name: string
          short_rests_today: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          current_period?: string
          description?: string | null
          gm_id: string
          id?: string
          last_long_rest_day?: number | null
          name: string
          short_rests_today?: number | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_day?: number
          current_period?: string
          description?: string | null
          gm_id?: string
          id?: string
          last_long_rest_day?: number | null
          name?: string
          short_rests_today?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          armor_class: number | null
          category: string
          condition_resistances: string[] | null
          created_at: string | null
          damage: string | null
          description: string | null
          effects: Json | null
          id: string
          is_consumable: boolean | null
          is_kit: boolean | null
          level: number | null
          name: string
          price: number | null
          requires_target: boolean | null
          slug: string
          weight: number | null
        }
        Insert: {
          armor_class?: number | null
          category: string
          condition_resistances?: string[] | null
          created_at?: string | null
          damage?: string | null
          description?: string | null
          effects?: Json | null
          id?: string
          is_consumable?: boolean | null
          is_kit?: boolean | null
          level?: number | null
          name: string
          price?: number | null
          requires_target?: boolean | null
          slug: string
          weight?: number | null
        }
        Update: {
          armor_class?: number | null
          category?: string
          condition_resistances?: string[] | null
          created_at?: string | null
          damage?: string | null
          description?: string | null
          effects?: Json | null
          id?: string
          is_consumable?: boolean | null
          is_kit?: boolean | null
          level?: number | null
          name?: string
          price?: number | null
          requires_target?: boolean | null
          slug?: string
          weight?: number | null
        }
        Relationships: []
      }
      kit_items: {
        Row: {
          id: string
          item_id: string
          kit_id: string
          quantity: number | null
        }
        Insert: {
          id?: string
          item_id: string
          kit_id: string
          quantity?: number | null
        }
        Update: {
          id?: string
          item_id?: string
          kit_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kit_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      session_enemies: {
        Row: {
          base_enemy_id: string
          created_at: string
          current_hp: number
          id: string
          max_hp: number
          name: string
          session_id: string
        }
        Insert: {
          base_enemy_id: string
          created_at?: string
          current_hp: number
          id?: string
          max_hp: number
          name: string
          session_id: string
        }
        Update: {
          base_enemy_id?: string
          created_at?: string
          current_hp?: number
          id?: string
          max_hp?: number
          name?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_enemies_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_npcs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_visible: boolean
          name: string
          session_id: string
          stats: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          name: string
          session_id: string
          stats?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          session_id?: string
          stats?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "session_npcs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          character_id: string
          created_at: string
          id: string
          joined: boolean
          session_id: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          joined?: boolean
          session_id: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          joined?: boolean
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_test_results: {
        Row: {
          applied_mode: string | null
          character_id: string
          created_at: string
          id: string
          inspiration_used: boolean
          is_approved: boolean | null
          master_mark: string | null
          player_id: string
          result_value: number | null
          roll_value: number | null
          roll_values: number[] | null
          status: string
          test_id: string
          updated_at: string
        }
        Insert: {
          applied_mode?: string | null
          character_id: string
          created_at?: string
          id?: string
          inspiration_used?: boolean
          is_approved?: boolean | null
          master_mark?: string | null
          player_id: string
          result_value?: number | null
          roll_value?: number | null
          roll_values?: number[] | null
          status?: string
          test_id: string
          updated_at?: string
        }
        Update: {
          applied_mode?: string | null
          character_id?: string
          created_at?: string
          id?: string
          inspiration_used?: boolean
          is_approved?: boolean | null
          master_mark?: string | null
          player_id?: string
          result_value?: number | null
          roll_value?: number | null
          roll_values?: number[] | null
          status?: string
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_test_results_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "session_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      session_tests: {
        Row: {
          created_at: string
          difficulty: number
          faith_use: string | null
          id: string
          selfish_request: boolean
          session_id: string
          status: string
          test_type: string
        }
        Insert: {
          created_at?: string
          difficulty: number
          faith_use?: string | null
          id?: string
          selfish_request?: boolean
          session_id: string
          status?: string
          test_type: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          faith_use?: string | null
          id?: string
          selfish_request?: boolean
          session_id?: string
          status?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_tests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_items: {
        Row: {
          created_at: string
          custom_condition_resistances: string[] | null
          id: string
          item_id: string
          level: number
          quantity: number
          side: string
          trade_id: string
          weapon_effects: Json | null
        }
        Insert: {
          created_at?: string
          custom_condition_resistances?: string[] | null
          id?: string
          item_id: string
          level?: number
          quantity?: number
          side: string
          trade_id: string
          weapon_effects?: Json | null
        }
        Update: {
          created_at?: string
          custom_condition_resistances?: string[] | null
          id?: string
          item_id?: string
          level?: number
          quantity?: number
          side?: string
          trade_id?: string
          weapon_effects?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          initiator_character_id: string | null
          initiator_coins: number
          initiator_ready: boolean
          initiator_user_id: string
          session_id: string
          status: string
          target_character_id: string | null
          target_coins: number
          target_npc_id: string | null
          target_ready: boolean
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          initiator_character_id?: string | null
          initiator_coins?: number
          initiator_ready?: boolean
          initiator_user_id: string
          session_id: string
          status?: string
          target_character_id?: string | null
          target_coins?: number
          target_npc_id?: string | null
          target_ready?: boolean
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          initiator_character_id?: string | null
          initiator_coins?: number
          initiator_ready?: boolean
          initiator_user_id?: string
          session_id?: string
          status?: string
          target_character_id?: string | null
          target_coins?: number
          target_npc_id?: string | null
          target_ready?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_initiator_character_id_fkey"
            columns: ["initiator_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_target_npc_id_fkey"
            columns: ["target_npc_id"]
            isOneToOne: false
            referencedRelation: "session_npcs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_attack: {
        Args: {
          p_attacker_participant_id: string
          p_critical: boolean
          p_damage: number
          p_fumble: boolean
          p_hit: boolean
          p_natural_roll: number
          p_target_ac: number
          p_target_participant_id: string
          p_total: number
        }
        Returns: string
      }
      can_manage_character: {
        Args: { check_character_id: string }
        Returns: boolean
      }
      cancel_session_trades: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      create_game_session: {
        Args: {
          enemies: Json
          npcs: Json
          participant_character_ids: string[]
          session_description: string
          session_name: string
        }
        Returns: string
      }
      execute_trade: { Args: { p_trade_id: string }; Returns: Json }
      is_session_gm: { Args: { check_session_id: string }; Returns: boolean }
      is_session_participant: {
        Args: { check_session_id: string }
        Returns: boolean
      }
      is_trade_participant: {
        Args: { check_trade_id: string }
        Returns: boolean
      }
      use_consumable_item: {
        Args: { p_character_item_id: string; p_target_character_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      combat_entity_type: "player" | "npc" | "enemy"
      combat_status: "setup" | "active" | "paused" | "finished"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      combat_entity_type: ["player", "npc", "enemy"],
      combat_status: ["setup", "active", "paused", "finished"],
    },
  },
} as const
