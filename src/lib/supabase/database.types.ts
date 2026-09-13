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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      affiliate_levels: {
        Row: {
          benefits: Json | null
          commission_percentage: number
          created_at: string
          description: string | null
          id: string
          level_type: Database["public"]["Enums"]["affiliate_level_type"]
          name: string
          points_required: number
          projects_required: number
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          commission_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          level_type: Database["public"]["Enums"]["affiliate_level_type"]
          name: string
          points_required?: number
          projects_required?: number
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          commission_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          level_type?: Database["public"]["Enums"]["affiliate_level_type"]
          name?: string
          points_required?: number
          projects_required?: number
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_partners: {
        Row: {
          affiliate_code: string
          created_at: string
          current_level: Database["public"]["Enums"]["affiliate_level_type"]
          id: string
          is_active: boolean
          joined_at: string
          projects_closed: number
          referral_points_earned: number | null
          referred_by_code: string | null
          total_commission: number
          total_points: number
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          created_at?: string
          current_level?: Database["public"]["Enums"]["affiliate_level_type"]
          id?: string
          is_active?: boolean
          joined_at?: string
          projects_closed?: number
          referral_points_earned?: number | null
          referred_by_code?: string | null
          total_commission?: number
          total_points?: number
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          created_at?: string
          current_level?: Database["public"]["Enums"]["affiliate_level_type"]
          id?: string
          is_active?: boolean
          joined_at?: string
          projects_closed?: number
          referral_points_earned?: number | null
          referred_by_code?: string | null
          total_commission?: number
          total_points?: number
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_partners_referred_by_code_fkey"
            columns: ["referred_by_code"]
            isOneToOne: false
            referencedRelation: "affiliate_partners"
            referencedColumns: ["affiliate_code"]
          },
        ]
      }
      affiliate_point_actions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          points_value: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          points_value: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_point_requests: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          created_at: string
          description: string
          evidence_description: string | null
          evidence_url: string | null
          id: string
          point_action_id: string
          points_requested: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          created_at?: string
          description: string
          evidence_description?: string | null
          evidence_url?: string | null
          id?: string
          point_action_id: string
          points_requested: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          created_at?: string
          description?: string
          evidence_description?: string | null
          evidence_url?: string | null
          id?: string
          point_action_id?: string
          points_requested?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_point_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_point_requests_point_action_id_fkey"
            columns: ["point_action_id"]
            isOneToOne: false
            referencedRelation: "affiliate_point_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_point_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_redemptions: {
        Row: {
          affiliate_id: string
          id: string
          notes: string | null
          points_spent: number
          redeemed_at: string
          reward_id: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          id?: string
          notes?: string | null
          points_spent: number
          redeemed_at?: string
          reward_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          id?: string
          notes?: string | null
          points_spent?: number
          redeemed_at?: string
          reward_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_redemptions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "affiliate_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_rewards: {
        Row: {
          category: string
          cost_points: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          stock_limit: number | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          category: string
          cost_points: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          stock_limit?: number | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost_points?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          stock_limit?: number | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_transactions: {
        Row: {
          affiliate_id: string
          created_at: string
          description: string
          id: string
          points: number
          prospect_id: string | null
          reference_data: Json | null
          type: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          description: string
          id?: string
          points: number
          prospect_id?: string | null
          reference_data?: Json | null
          type: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          description?: string
          id?: string
          points?: number
          prospect_id?: string | null
          reference_data?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_transactions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_transactions_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_canvas_edges: {
        Row: {
          board: string
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          meta: Json
          owner: string
          source_entity: string
          target_entity: string
        }
        Insert: {
          board: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          meta?: Json
          owner?: string
          source_entity: string
          target_entity: string
        }
        Update: {
          board?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          meta?: Json
          owner?: string
          source_entity?: string
          target_entity?: string
        }
        Relationships: []
      }
      app_canvas_nodes: {
        Row: {
          board: string
          entity_id: string
          id: string
          owner: string
          updated_at: string
          updated_by: string | null
          x: number
          y: number
        }
        Insert: {
          board: string
          entity_id: string
          id?: string
          owner?: string
          updated_at?: string
          updated_by?: string | null
          x?: number
          y?: number
        }
        Update: {
          board?: string
          entity_id?: string
          id?: string
          owner?: string
          updated_at?: string
          updated_by?: string | null
          x?: number
          y?: number
        }
        Relationships: []
      }
      app_companies: {
        Row: {
          color: string | null
          created_at: string
          frente_slug: string | null
          id: string
          is_active_default: boolean
          logo_url: string | null
          name: string
          parent_id: string | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          frente_slug?: string | null
          id?: string
          is_active_default?: boolean
          logo_url?: string | null
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          frente_slug?: string | null
          id?: string
          is_active_default?: boolean
          logo_url?: string | null
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_companies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_clients: {
        Row: {
          client_id: string
          company_id: string
        }
        Insert: {
          client_id: string
          company_id: string
        }
        Update: {
          client_id?: string
          company_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_company_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_members: {
        Row: {
          company_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_roles: {
        Row: {
          company_id: string
          role_id: string
        }
        Insert: {
          company_id: string
          role_id: string
        }
        Update: {
          company_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_cronograma_checklist_itens: {
        Row: {
          checklist_id: string
          done: boolean
          id: string
          position: number
          text: string
        }
        Insert: {
          checklist_id: string
          done?: boolean
          id?: string
          position?: number
          text: string
        }
        Update: {
          checklist_id?: string
          done?: boolean
          id?: string
          position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_cronograma_checklist_itens_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "app_cronograma_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      app_cronograma_checklists: {
        Row: {
          cronograma_id: string
          id: string
          position: number
          title: string
        }
        Insert: {
          cronograma_id: string
          id?: string
          position?: number
          title: string
        }
        Update: {
          cronograma_id?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_cronograma_checklists_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "app_cronogramas"
            referencedColumns: ["id"]
          },
        ]
      }
      app_cronograma_fases: {
        Row: {
          created_at: string
          cronograma_id: string
          end_date: string | null
          id: string
          interval_label: string | null
          note: string | null
          position: number
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cronograma_id: string
          end_date?: string | null
          id?: string
          interval_label?: string | null
          note?: string | null
          position?: number
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cronograma_id?: string
          end_date?: string | null
          id?: string
          interval_label?: string | null
          note?: string | null
          position?: number
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_cronograma_fases_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "app_cronogramas"
            referencedColumns: ["id"]
          },
        ]
      }
      app_cronograma_itens: {
        Row: {
          created_at: string
          cronograma_id: string
          date: string | null
          fase_id: string
          id: string
          position: number
          status: string
          task_id: string | null
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cronograma_id: string
          date?: string | null
          fase_id: string
          id?: string
          position?: number
          status?: string
          task_id?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cronograma_id?: string
          date?: string | null
          fase_id?: string
          id?: string
          position?: number
          status?: string
          task_id?: string | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_cronograma_itens_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "app_cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_cronograma_itens_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "app_cronograma_fases"
            referencedColumns: ["id"]
          },
        ]
      }
      app_cronograma_secoes: {
        Row: {
          body: Json
          cronograma_id: string
          id: string
          kind: string
          position: number
          title: string
        }
        Insert: {
          body?: Json
          cronograma_id: string
          id?: string
          kind?: string
          position?: number
          title: string
        }
        Update: {
          body?: Json
          cronograma_id?: string
          id?: string
          kind?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_cronograma_secoes_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "app_cronogramas"
            referencedColumns: ["id"]
          },
        ]
      }
      app_cronogramas: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          current_fase_id: string | null
          description: string | null
          end_date: string | null
          id: string
          project_id: string | null
          project_kind: string | null
          share_token: string
          start_date: string | null
          template_key: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          current_fase_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          project_kind?: string | null
          share_token?: string
          start_date?: string | null
          template_key?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          current_fase_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          project_kind?: string | null
          share_token?: string
          start_date?: string | null
          template_key?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_cronogramas_current_fase_fk"
            columns: ["current_fase_id"]
            isOneToOne: false
            referencedRelation: "app_cronograma_fases"
            referencedColumns: ["id"]
          },
        ]
      }
      app_permissions: {
        Row: {
          area: string
          description: string | null
          key: string
          label: string
          position: number
        }
        Insert: {
          area: string
          description?: string | null
          key: string
          label: string
          position?: number
        }
        Update: {
          area?: string
          description?: string | null
          key?: string
          label?: string
          position?: number
        }
        Relationships: []
      }
      app_role_permissions: {
        Row: {
          permission_key: string
          role_id: string
        }
        Insert: {
          permission_key: string
          role_id: string
        }
        Update: {
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "app_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_roles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_team_members: {
        Row: {
          is_lead: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          is_lead?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          is_lead?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "app_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      app_team_roles: {
        Row: {
          role_id: string
          team_id: string
        }
        Insert: {
          role_id: string
          team_id: string
        }
        Update: {
          role_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_team_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_team_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "app_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      app_teams: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user_prefs: {
        Row: {
          active_company_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_company_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_company_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_prefs_active_company_id_fkey"
            columns: ["active_company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          id: string
          items: Json
          status: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: string[] | null
          color: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_type: string
          google_event_id: string | null
          id: string
          is_all_day: boolean
          location: string | null
          start_date: string
          subtask_id: string | null
          synced_from_google: boolean
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          google_event_id?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_date: string
          subtask_id?: string | null
          synced_from_google?: boolean
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          google_event_id?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_date?: string
          subtask_id?: string | null
          synced_from_google?: boolean
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          channel_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          channel_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_message_reads: {
        Row: {
          created_at: string
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string
          edited_at: string | null
          file_url: string | null
          id: string
          is_edited: boolean
          message_type: string
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_request_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean
          request_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          request_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          request_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "client_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requests: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          budget_range: string | null
          category: string
          client_id: string
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          budget_range?: string | null
          category?: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          budget_range?: string | null
          category?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          monthly_price: number
          plan_type: string
          started_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          monthly_price?: number
          plan_type?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          monthly_price?: number
          plan_type?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          figma_link: string | null
          id: string
          is_seed: boolean
          mrr: number
          name: string
          notes: string | null
          phone: string | null
          segment: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          figma_link?: string | null
          id?: string
          is_seed?: boolean
          mrr?: number
          name: string
          notes?: string | null
          phone?: string | null
          segment?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          figma_link?: string | null
          id?: string
          is_seed?: boolean
          mrr?: number
          name?: string
          notes?: string | null
          phone?: string | null
          segment?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_cash: {
        Row: {
          created_at: string
          current_amount: number
          description: string | null
          id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      company_goals: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          current_amount: number
          description: string | null
          id: string
          is_active: boolean
          target_amount: number
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          current_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean
          target_amount?: number
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          current_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean
          target_amount?: number
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contratos_assinaturas: {
        Row: {
          cliente: string
          contrato_hash: string
          contrato_texto: string
          cpf_cnpj: string
          email: string | null
          id: number
          ip: string | null
          itens_selecionados: Json | null
          nome: string
          signed_at: string
          telefone: string | null
          user_agent: string | null
        }
        Insert: {
          cliente: string
          contrato_hash: string
          contrato_texto: string
          cpf_cnpj: string
          email?: string | null
          id?: never
          ip?: string | null
          itens_selecionados?: Json | null
          nome: string
          signed_at?: string
          telefone?: string | null
          user_agent?: string | null
        }
        Update: {
          cliente?: string
          contrato_hash?: string
          contrato_texto?: string
          cpf_cnpj?: string
          email?: string | null
          id?: never
          ip?: string | null
          itens_selecionados?: Json | null
          nome?: string
          signed_at?: string
          telefone?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          link: string | null
          password: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          link?: string | null
          password?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          link?: string | null
          password?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      emerge_labs_products: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          download_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          preview_url: string | null
          price_money: number | null
          price_points: number | null
          stock_quantity: number | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          preview_url?: string | null
          price_money?: number | null
          price_points?: number | null
          stock_quantity?: number | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          preview_url?: string | null
          price_money?: number | null
          price_points?: number | null
          stock_quantity?: number | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      emerge_labs_purchases: {
        Row: {
          amount_paid: number | null
          download_count: number | null
          expires_at: string | null
          id: string
          max_downloads: number | null
          points_paid: number | null
          product_id: string
          purchase_type: string
          purchased_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          download_count?: number | null
          expires_at?: string | null
          id?: string
          max_downloads?: number | null
          points_paid?: number | null
          product_id: string
          purchase_type: string
          purchased_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          download_count?: number | null
          expires_at?: string | null
          id?: string
          max_downloads?: number | null
          points_paid?: number | null
          product_id?: string
          purchase_type?: string
          purchased_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emerge_labs_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "emerge_labs_products"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          recurring: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          recurring?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          recurring?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      freelancer_proposals: {
        Row: {
          admin_feedback: string | null
          created_at: string
          description: string
          estimated_hours: number | null
          freelancer_id: string
          id: string
          profit_margin: number | null
          project_id: string
          proposed_deadline: string
          proposed_value: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
        }
        Insert: {
          admin_feedback?: string | null
          created_at?: string
          description: string
          estimated_hours?: number | null
          freelancer_id: string
          id?: string
          profit_margin?: number | null
          project_id: string
          proposed_deadline: string
          proposed_value: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Update: {
          admin_feedback?: string | null
          created_at?: string
          description?: string
          estimated_hours?: number | null
          freelancer_id?: string
          id?: string
          profit_margin?: number | null
          project_id?: string
          proposed_deadline?: string
          proposed_value?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_proposals_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freelancer_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancers: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          availability_status: string
          behance_url: string | null
          bio: string | null
          categories: Database["public"]["Enums"]["freelancer_category"][]
          created_at: string
          email: string
          full_name: string
          github_url: string | null
          hourly_rate: number | null
          id: string
          instagram_url: string | null
          is_active: boolean
          phone: string | null
          portfolio_url: string | null
          rating: number | null
          total_projects: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string
          behance_url?: string | null
          bio?: string | null
          categories?: Database["public"]["Enums"]["freelancer_category"][]
          created_at?: string
          email: string
          full_name: string
          github_url?: string | null
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          total_projects?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          availability_status?: string
          behance_url?: string | null
          bio?: string | null
          categories?: Database["public"]["Enums"]["freelancer_category"][]
          created_at?: string
          email?: string
          full_name?: string
          github_url?: string | null
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          total_projects?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          google_email: string | null
          id: string
          last_synced_at: string | null
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_synced_at?: string | null
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_synced_at?: string | null
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          task_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          task_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          task_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_agent_activity: {
        Row: {
          agent_name: string
          created_at: string
          detail: string | null
          event_type: string
          id: string
          link: string | null
          project_id: string
          roadmap_item_id: string | null
          summary: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          detail?: string | null
          event_type?: string
          id?: string
          link?: string | null
          project_id: string
          roadmap_item_id?: string | null
          summary: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          detail?: string | null
          event_type?: string
          id?: string
          link?: string | null
          project_id?: string
          roadmap_item_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_agent_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ops_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_agent_activity_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "ops_roadmap_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_projects: {
        Row: {
          created_at: string
          default_client_id: string | null
          description: string | null
          id: string
          name: string
          repo_url: string | null
          slug: string
          status: string
        }
        Insert: {
          created_at?: string
          default_client_id?: string | null
          description?: string | null
          id?: string
          name: string
          repo_url?: string | null
          slug: string
          status?: string
        }
        Update: {
          created_at?: string
          default_client_id?: string | null
          description?: string | null
          id?: string
          name?: string
          repo_url?: string | null
          slug?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_projects_default_client_id_fkey"
            columns: ["default_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_roadmap_items: {
        Row: {
          agent_name: string | null
          created_at: string
          description: string | null
          id: string
          link: string | null
          position: number
          priority: string | null
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          position?: number
          priority?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          position?: number
          priority?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_roadmap_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ops_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_messages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          created_at: string
          created_by_agent: string | null
          error: string | null
          id: string
          lead_id: number
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          created_at?: string
          created_by_agent?: string | null
          error?: string | null
          id?: string
          lead_id: number
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          created_at?: string
          created_by_agent?: string | null
          error?: string | null
          id?: string
          lead_id?: number
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vendas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_access: {
        Row: {
          additional_info: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          login_url: string | null
          password: string | null
          platform_name: string
          updated_at: string
          username: string | null
        }
        Insert: {
          additional_info?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          login_url?: string | null
          password?: string | null
          platform_name: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          additional_info?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          login_url?: string | null
          password?: string | null
          platform_name?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_types: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          mood: string | null
          requested_role: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mood?: string | null
          requested_role?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mood?: string | null
          requested_role?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_freelancer_invites: {
        Row: {
          created_at: string
          freelancer_id: string
          id: string
          invited_at: string
          invited_by: string
          project_id: string
        }
        Insert: {
          created_at?: string
          freelancer_id: string
          id?: string
          invited_at?: string
          invited_by: string
          project_id: string
        }
        Update: {
          created_at?: string
          freelancer_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_freelancer_invites_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_freelancer_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_freelancer_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_freelancers: {
        Row: {
          admin_notes: string | null
          budget_max: number | null
          budget_min: number | null
          client_id: string | null
          client_name: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          id: string
          required_categories: Database["public"]["Enums"]["freelancer_category"][]
          status: Database["public"]["Enums"]["project_freelancer_status"]
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          id?: string
          required_categories?: Database["public"]["Enums"]["freelancer_category"][]
          status?: Database["public"]["Enums"]["project_freelancer_status"]
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          id?: string
          required_categories?: Database["public"]["Enums"]["freelancer_category"][]
          status?: Database["public"]["Enums"]["project_freelancer_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_freelancers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          aprovada_em: string | null
          contexto: string
          created_at: string
          data_proposta: string
          escopo: Json
          id: number
          investimento: Json
          lede: string
          nome_cliente: string
          nome_exibicao: string
          proxima_acao_em: string | null
          proxima_acao_nota: string | null
          slug: string
          status: string
          ultimo_followup_em: string | null
          updated_at: string
          valida_ate: string | null
        }
        Insert: {
          aprovada_em?: string | null
          contexto?: string
          created_at?: string
          data_proposta?: string
          escopo?: Json
          id?: never
          investimento?: Json
          lede?: string
          nome_cliente: string
          nome_exibicao: string
          proxima_acao_em?: string | null
          proxima_acao_nota?: string | null
          slug: string
          status?: string
          ultimo_followup_em?: string | null
          updated_at?: string
          valida_ate?: string | null
        }
        Update: {
          aprovada_em?: string | null
          contexto?: string
          created_at?: string
          data_proposta?: string
          escopo?: Json
          id?: never
          investimento?: Json
          lede?: string
          nome_cliente?: string
          nome_exibicao?: string
          proxima_acao_em?: string | null
          proxima_acao_nota?: string | null
          slug?: string
          status?: string
          ultimo_followup_em?: string | null
          updated_at?: string
          valida_ate?: string | null
        }
        Relationships: []
      }
      propostas_events: {
        Row: {
          created_at: string
          duration_seconds: number | null
          elemento: string | null
          id: number
          proposta: string
          session_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          elemento?: string | null
          id?: never
          proposta: string
          session_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          elemento?: string | null
          id?: never
          proposta?: string
          session_id?: string
          tipo?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          approved_by: string | null
          closed_at: string | null
          commission_amount: number | null
          commission_percentage: number | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          meeting_notes: string | null
          meeting_scheduled_at: string | null
          project_value: number | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          closed_at?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          meeting_notes?: string | null
          meeting_scheduled_at?: string | null
          project_value?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          closed_at?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          meeting_notes?: string | null
          meeting_scheduled_at?: string | null
          project_value?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_projects: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          monthly_amount: number
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          monthly_amount?: number
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          monthly_amount?: number
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      social_day_markers: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          date: string
          id: string
          label: string
          project_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          label: string
          project_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          label?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_day_markers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "social_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_assets: {
        Row: {
          created_at: string
          format: string
          id: string
          image_url: string
          post_id: string
          sort: number
        }
        Insert: {
          created_at?: string
          format?: string
          id?: string
          image_url: string
          post_id: string
          sort?: number
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          image_url?: string
          post_id?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_post_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_comments: {
        Row: {
          author_ip: unknown
          author_name: string | null
          author_user: string | null
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_ip?: unknown
          author_name?: string | null
          author_user?: string | null
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_ip?: unknown
          author_name?: string | null
          author_user?: string | null
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          ideia: string | null
          legenda: string | null
          objetivo: string | null
          platforms: string[]
          position: number
          project_id: string
          status: string
          task_id: string | null
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          ideia?: string | null
          legenda?: string | null
          objetivo?: string | null
          platforms?: string[]
          position?: number
          project_id: string
          status?: string
          task_id?: string | null
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          ideia?: string | null
          legenda?: string | null
          objetivo?: string | null
          platforms?: string[]
          position?: number
          project_id?: string
          status?: string
          task_id?: string | null
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "social_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      social_projects: {
        Row: {
          client_id: string | null
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          share_expires_at: string | null
          share_last_viewed_at: string | null
          share_token: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          share_expires_at?: string | null
          share_last_viewed_at?: string | null
          share_token?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          share_expires_at?: string | null
          share_last_viewed_at?: string | null
          share_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      specific_projects: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          first_installment_date: string | null
          id: string
          installments: number | null
          paid_amount: number
          payment_date: string | null
          second_installment_date: string | null
          status: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          first_installment_date?: string | null
          id?: string
          installments?: number | null
          paid_amount?: number
          payment_date?: string | null
          second_installment_date?: string | null
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          first_installment_date?: string | null
          id?: string
          installments?: number | null
          paid_amount?: number
          payment_date?: string | null
          second_installment_date?: string | null
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specific_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_deliveries: {
        Row: {
          created_at: string
          description: string | null
          drive_folder_url: string | null
          feedback: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          submitted_by: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          drive_folder_url?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          drive_folder_url?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_deliveries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          estimated_hours: number | null
          id: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          agent_name: string | null
          archived: boolean
          assigned_to: string | null
          briefing: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          drive_link: string | null
          due_date: string | null
          figma_link: string | null
          id: string
          ops_project_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          archived?: boolean
          assigned_to?: string | null
          briefing?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drive_link?: string | null
          due_date?: string | null
          figma_link?: string | null
          id?: string
          ops_project_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          archived?: boolean
          assigned_to?: string | null
          briefing?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drive_link?: string | null
          due_date?: string | null
          figma_link?: string | null
          id?: string
          ops_project_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_ops_project_id_fkey"
            columns: ["ops_project_id"]
            isOneToOne: false
            referencedRelation: "ops_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean
          start_time: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          start_time: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          start_time?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_leads: {
        Row: {
          atualizado_em: string
          contato: string | null
          criado_em: string
          criado_por: string
          empresa: string
          frente: string
          id: number
          motivo_fit: string | null
          origem: string | null
          proposta_slug: string | null
          responsavel: string | null
          segmento: string | null
          status: string
          unidade: string
          valor_estimado: number
        }
        Insert: {
          atualizado_em?: string
          contato?: string | null
          criado_em?: string
          criado_por?: string
          empresa: string
          frente: string
          id?: never
          motivo_fit?: string | null
          origem?: string | null
          proposta_slug?: string | null
          responsavel?: string | null
          segmento?: string | null
          status?: string
          unidade?: string
          valor_estimado?: number
        }
        Update: {
          atualizado_em?: string
          contato?: string | null
          criado_em?: string
          criado_por?: string
          empresa?: string
          frente?: string
          id?: never
          motivo_fit?: string | null
          origem?: string | null
          proposta_slug?: string | null
          responsavel?: string | null
          segmento?: string | null
          status?: string
          unidade?: string
          valor_estimado?: number
        }
        Relationships: []
      }
      vendas_metas: {
        Row: {
          atualizado_em: string
          criado_em: string
          frente: string
          funil_semanal_meta: Json | null
          id: number
          meta_novos_clientes: number | null
          meta_propostas_enviadas: number | null
          meta_status: string
          meta_valor: number | null
          periodo: string
          realizado_novos_clientes: number
          realizado_propostas_enviadas: number
          realizado_valor: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          frente: string
          funil_semanal_meta?: Json | null
          id?: never
          meta_novos_clientes?: number | null
          meta_propostas_enviadas?: number | null
          meta_status?: string
          meta_valor?: number | null
          periodo: string
          realizado_novos_clientes?: number
          realizado_propostas_enviadas?: number
          realizado_valor?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          frente?: string
          funil_semanal_meta?: Json | null
          id?: never
          meta_novos_clientes?: number | null
          meta_propostas_enviadas?: number | null
          meta_status?: string
          meta_valor?: number | null
          periodo?: string
          realizado_novos_clientes?: number
          realizado_propostas_enviadas?: number
          realizado_valor?: number
        }
        Relationships: []
      }
      vendas_oportunidades: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string
          fonte: string | null
          frente_sugerida: string | null
          id: number
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao: string
          fonte?: string | null
          frente_sugerida?: string | null
          id?: never
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string
          fonte?: string | null
          frente_sugerida?: string | null
          id?: never
          status?: string
          titulo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_effective_roles: {
        Args: { uid: string }
        Returns: {
          role_color: string
          role_id: string
          role_name: string
          source: string
        }[]
      }
      app_effective_roles_all: {
        Args: never
        Returns: {
          role_color: string
          role_id: string
          role_name: string
          source: string
          user_id: string
        }[]
      }
      app_has_permission: {
        Args: { perm: string; uid: string }
        Returns: boolean
      }
      app_is_admin: { Args: { uid: string }; Returns: boolean }
      app_team_members: {
        Args: never
        Returns: {
          approval_status: string
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          mood: string
          requested_role: string
          roles: string[]
          user_id: string
        }[]
      }
      approve_user: {
        Args: { approved_by_id: string; user_profile_id: string }
        Returns: boolean
      }
      cleanup_old_chat_messages: { Args: never; Returns: undefined }
      create_freelancer_profile: {
        Args: {
          p_behance_url?: string
          p_categories?: string[]
          p_email: string
          p_full_name: string
          p_github_url?: string
          p_instagram_url?: string
          p_phone?: string
          p_user_id: string
        }
        Returns: boolean
      }
      delete_user_and_data: {
        Args: { admin_user_id: string; target_user_id: string }
        Returns: boolean
      }
      get_cronograma_by_token: { Args: { p_token: string }; Returns: Json }
      get_social_share: { Args: { p_token: string }; Returns: Json }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_user_role_safe: { Args: { user_id: string }; Returns: string }
      log_social_share_open: {
        Args: { p_ip: string; p_token: string }
        Returns: undefined
      }
      ops_agent_upsert_task: {
        Args: {
          p_agent_name: string
          p_description?: string
          p_due_date?: string
          p_link?: string
          p_priority?: string
          p_project_slug: string
          p_status?: string
          p_task_id?: string
          p_title?: string
        }
        Returns: string
      }
      ops_ensure_project: {
        Args: { p_name?: string; p_slug: string }
        Returns: string
      }
      ops_report_activity: {
        Args: {
          p_agent_name: string
          p_detail?: string
          p_event_type?: string
          p_link?: string
          p_project_slug: string
          p_roadmap_item_id?: string
          p_summary: string
        }
        Returns: string
      }
      ops_upsert_roadmap_item: {
        Args: {
          p_agent_name?: string
          p_description?: string
          p_item_id?: string
          p_link?: string
          p_priority?: string
          p_project_slug: string
          p_status?: string
          p_title?: string
        }
        Returns: string
      }
      reject_user: {
        Args: { rejected_by_id: string; user_profile_id: string }
        Returns: boolean
      }
      social_public_comment: {
        Args: {
          p_body: string
          p_ip: string
          p_name: string
          p_post_id: string
          p_token: string
        }
        Returns: undefined
      }
      social_public_review: {
        Args: {
          p_comment: string
          p_decision: string
          p_ip: string
          p_name: string
          p_post_id: string
          p_token: string
        }
        Returns: undefined
      }
    }
    Enums: {
      affiliate_level_type:
        | "conector"
        | "impulsionador"
        | "visionario"
        | "socio_criativo"
      freelancer_category:
        | "social_media"
        | "posts_avulsos"
        | "motion_avulso"
        | "identidade_visual"
        | "motion_3d"
        | "edicao_video"
      project_freelancer_status:
        | "draft"
        | "open_for_proposals"
        | "in_negotiation"
        | "approved"
        | "in_progress"
        | "completed"
        | "cancelled"
      proposal_status: "pending" | "approved" | "rejected" | "withdrawn"
      user_role:
        | "admin"
        | "employee"
        | "affiliate"
        | "student"
        | "freelancer"
        | "client"
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
      affiliate_level_type: [
        "conector",
        "impulsionador",
        "visionario",
        "socio_criativo",
      ],
      freelancer_category: [
        "social_media",
        "posts_avulsos",
        "motion_avulso",
        "identidade_visual",
        "motion_3d",
        "edicao_video",
      ],
      project_freelancer_status: [
        "draft",
        "open_for_proposals",
        "in_negotiation",
        "approved",
        "in_progress",
        "completed",
        "cancelled",
      ],
      proposal_status: ["pending", "approved", "rejected", "withdrawn"],
      user_role: [
        "admin",
        "employee",
        "affiliate",
        "student",
        "freelancer",
        "client",
      ],
    },
  },
} as const
