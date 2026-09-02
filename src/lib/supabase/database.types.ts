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
          id: string
          is_all_day: boolean
          location: string | null
          start_date: string
          subtask_id: string | null
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
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_date: string
          subtask_id?: string | null
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
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_date?: string
          subtask_id?: string | null
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
          created_at: string
          created_by: string | null
          email: string | null
          figma_link: string | null
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          figma_link?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          figma_link?: string | null
          id?: string
          name?: string
          phone?: string | null
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
          assigned_to: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          drive_link: string | null
          due_date: string | null
          figma_link: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drive_link?: string | null
          due_date?: string | null
          figma_link?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drive_link?: string | null
          due_date?: string | null
          figma_link?: string | null
          id?: string
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
          segmento: string | null
          status: string
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
          segmento?: string | null
          status?: string
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
          segmento?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_leads_proposta_slug_fkey"
            columns: ["proposta_slug"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["slug"]
          },
        ]
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
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_user_role_safe: { Args: { user_id: string }; Returns: string }
      reject_user: {
        Args: { rejected_by_id: string; user_profile_id: string }
        Returns: boolean
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
