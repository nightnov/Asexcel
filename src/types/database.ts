export type FileStatus = "uploaded" | "processing" | "ready" | "error";
export type MessageRole = "user" | "assistant" | "system";
export type UserPlan = "free" | "pro";
export type ProPlanType = "monthly" | "annual";

export interface Database {
  // Required by @supabase/supabase-js's typed-client generics (matches the
  // shape emitted by `supabase gen types`) to resolve the "public" schema
  // instead of falling back to `never` for every row type.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          daily_quota_used: number;
          quota_reset_at: string;
          plan: UserPlan;
          plan_type: ProPlanType | null;
          tebex_transaction_id: string | null;
          welcome_email_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          daily_quota_used?: number;
          quota_reset_at?: string;
          plan?: UserPlan;
          plan_type?: ProPlanType | null;
          tebex_transaction_id?: string | null;
          welcome_email_sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          email: string | null;
          daily_quota_used: number;
          quota_reset_at: string;
          plan: UserPlan;
          plan_type: ProPlanType | null;
          tebex_transaction_id: string | null;
          welcome_email_sent_at: string | null;
        }>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
        };
        Update: Partial<{ title: string }>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          created_at?: string;
        };
        Update: Partial<{ content: string }>;
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          status: FileStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          status?: FileStatus;
          created_at?: string;
        };
        Update: Partial<{ status: FileStatus }>;
        Relationships: [];
      };
      answer_cache: {
        Row: {
          id: string;
          question_normalized: string;
          question_original: string;
          answer: string;
          model: string;
          hit_count: number;
          created_at: string;
          last_used_at: string;
          namespace: string;
        };
        Insert: {
          id?: string;
          question_normalized: string;
          question_original: string;
          answer: string;
          model: string;
          hit_count?: number;
          created_at?: string;
          last_used_at?: string;
          namespace?: string;
        };
        Update: Partial<{ hit_count: number; last_used_at: string }>;
        Relationships: [];
      };
      support_requests: {
        Row: {
          id: string;
          message: string;
          email: string | null;
          status: "new" | "read" | "resolved";
          created_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          email?: string | null;
          status?: "new" | "read" | "resolved";
          created_at?: string;
        };
        Update: Partial<{ status: "new" | "read" | "resolved" }>;
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          category: "support" | "pro_confirmation" | "welcome" | "otp_code";
          recipient: string;
          subject: string;
          status: "sent" | "failed";
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: "support" | "pro_confirmation" | "welcome" | "otp_code";
          recipient: string;
          subject: string;
          status: "sent" | "failed";
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<{ status: "sent" | "failed"; error: string | null }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_cache_hit: {
        Args: { cache_id: string };
        Returns: undefined;
      };
      match_cached_answer: {
        Args: { query_text: string; min_similarity?: number; p_namespace?: string };
        Returns: {
          id: string;
          answer: string;
          model: string;
          question_original: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
