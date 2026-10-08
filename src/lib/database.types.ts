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
      linked_vaults: {
        Row: {
          created_at: string
          id: string
          is_bootstrapping: boolean
          local_vault_path: string
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_bootstrapping?: boolean
          local_vault_path: string
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_bootstrapping?: boolean
          local_vault_path?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linked_vaults_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_vaults_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      note_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          note_id: string
          space_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          note_id: string
          space_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          note_id?: string
          space_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_chunks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_chunks_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          auth_tag: string | null
          client_id: string | null
          content: string
          content_encrypted: string | null
          content_hash: string
          created_at: string
          deleted: boolean
          encryption_version: number | null
          id: string
          is_canvas: boolean
          iv: string | null
          last_client_id: string | null
          last_modified: string
          path: string
          pinned: boolean
          space_id: string | null
          title: string
          updated_at: string
          vault_id: string | null
          version: number
        }
        Insert: {
          auth_tag?: string | null
          client_id?: string | null
          content: string
          content_encrypted?: string | null
          content_hash?: string
          created_at?: string
          deleted?: boolean
          encryption_version?: number | null
          id?: string
          is_canvas?: boolean
          iv?: string | null
          last_client_id?: string | null
          last_modified?: string
          path?: string
          pinned?: boolean
          space_id?: string | null
          title: string
          updated_at?: string
          vault_id?: string | null
          version?: number
        }
        Update: {
          auth_tag?: string | null
          client_id?: string | null
          content?: string
          content_encrypted?: string | null
          content_hash?: string
          created_at?: string
          deleted?: boolean
          encryption_version?: number | null
          id?: string
          is_canvas?: boolean
          iv?: string | null
          last_client_id?: string | null
          last_modified?: string
          path?: string
          pinned?: boolean
          space_id?: string | null
          title?: string
          updated_at?: string
          vault_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "notes_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      space_collaborators: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          encrypted_space_key: string | null
          encryption_version: number | null
          id: string
          invited_at: string | null
          key_auth_tag: string | null
          key_iv: string | null
          key_version: number | null
          key_wrapping: string | null
          role: string
          space_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          encrypted_space_key?: string | null
          encryption_version?: number | null
          id?: string
          invited_at?: string | null
          key_auth_tag?: string | null
          key_iv?: string | null
          key_version?: number | null
          key_wrapping?: string | null
          role?: string
          space_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          encrypted_space_key?: string | null
          encryption_version?: number | null
          id?: string
          invited_at?: string | null
          key_auth_tag?: string | null
          key_iv?: string | null
          key_version?: number | null
          key_wrapping?: string | null
          role?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_collaborators_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      space_embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          space_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          space_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_embeddings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: true
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invites: {
        Row: {
          created_at: string
          id: string
          receiver_email: string
          receiver_id: string | null
          role: string
          sender_id: string
          space_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_email: string
          receiver_id?: string | null
          role?: string
          sender_id: string
          space_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_email?: string
          receiver_id?: string | null
          role?: string
          sender_id?: string
          space_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_invites_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_invites_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_stats: {
        Row: {
          forks: number
          score: number | null
          space_id: string
          upvotes: number
          views: number
        }
        Insert: {
          forks?: number
          score?: number | null
          space_id: string
          upvotes?: number
          views?: number
        }
        Update: {
          forks?: number
          score?: number | null
          space_id?: string
          upvotes?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "space_stats_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: true
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_votes: {
        Row: {
          created_at: string
          id: string
          space_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          space_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          space_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "space_votes_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          description: string | null
          encrypted_space_key: string | null
          encryption_version: number | null
          forked_from: string | null
          helps_with: string[] | null
          id: string
          is_public: boolean
          kdf: string | null
          kdf_params: Json | null
          key_auth_tag: string | null
          key_iv: string | null
          key_salt: string | null
          key_version: number
          key_wrapping: string | null
          owner_id: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          encrypted_space_key?: string | null
          encryption_version?: number | null
          forked_from?: string | null
          helps_with?: string[] | null
          id?: string
          is_public?: boolean
          kdf?: string | null
          kdf_params?: Json | null
          key_auth_tag?: string | null
          key_iv?: string | null
          key_salt?: string | null
          key_version?: number
          key_wrapping?: string | null
          owner_id: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          encrypted_space_key?: string | null
          encryption_version?: number | null
          forked_from?: string | null
          helps_with?: string[] | null
          id?: string
          is_public?: boolean
          kdf?: string | null
          kdf_params?: Json | null
          key_auth_tag?: string | null
          key_iv?: string | null
          key_salt?: string | null
          key_version?: number
          key_wrapping?: string | null
          owner_id?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_forked_from_fkey"
            columns: ["forked_from"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      vault_collaborators: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
          vault_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_collaborators_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invited_user_email: string
          status: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invited_user_email: string
          status: string
          vault_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invited_user_email?: string
          status?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_invites_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_presence: {
        Row: {
          active_note_id: string | null
          last_seen: string
          user_id: string
          vault_id: string
        }
        Insert: {
          active_note_id?: string | null
          last_seen?: string
          user_id: string
          vault_id: string
        }
        Update: {
          active_note_id?: string | null
          last_seen?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_presence_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaults_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_space_invite: { Args: { p_invite_id: string }; Returns: undefined }
      get_space_snapshot: { Args: { p_space_id: string }; Returns: Json }
      increment_space_forks: { Args: { space_id: string }; Returns: undefined }
      increment_space_views: {
        Args: { p_space_id: string }
        Returns: undefined
      }
      match_note_chunks: {
        Args: {
          filter_space_id?: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          note_id: string
          note_path: string
          note_title: string
          similarity: number
        }[]
      }
      match_spaces: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          description: string
          similarity: number
          space_id: string
          title: string
        }[]
      }
      reject_space_invite: { Args: { p_invite_id: string }; Returns: undefined }
      vote_on_space: {
        Args: { p_space_id: string; p_value: number }
        Returns: undefined
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
