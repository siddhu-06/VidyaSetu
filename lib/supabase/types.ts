export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      mentors: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string;
          languages: string[];
          focus_grades: string[];
          localities: string[];
          weekly_capacity: number;
          sessions_completed: number;
          consistency_score: number;
          empathy_score: number;
          teaching_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone: string;
          languages?: string[];
          focus_grades?: string[];
          localities?: string[];
          weekly_capacity?: number;
          sessions_completed?: number;
          consistency_score?: number;
          empathy_score?: number;
          teaching_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string;
          languages?: string[];
          focus_grades?: string[];
          localities?: string[];
          weekly_capacity?: number;
          sessions_completed?: number;
          consistency_score?: number;
          empathy_score?: number;
          teaching_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentor_matches: {
        Row: {
          id: string;
          student_id: string;
          mentor_id: string;
          score: number;
          signal_breakdown: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          mentor_id: string;
          score: number;
          signal_breakdown: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          mentor_id?: string;
          score?: number;
          signal_breakdown?: Json;
          created_at?: string;
        };
      };
      parent_messages: {
        Row: {
          id: string;
          student_id: string;
          direction: string;
          channel: string;
          locale: string;
          body: string;
          delivery_status: string;
          response_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          direction: string;
          channel?: string;
          locale: string;
          body: string;
          delivery_status?: string;
          response_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          direction?: string;
          channel?: string;
          locale?: string;
          body?: string;
          delivery_status?: string;
          response_code?: string | null;
          created_at?: string;
        };
      };
      passport_shares: {
        Row: {
          id: string;
          student_id: string;
          public_code: string;
          active: boolean;
          last_viewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          public_code: string;
          active?: boolean;
          last_viewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          public_code?: string;
          active?: boolean;
          last_viewed_at?: string | null;
          created_at?: string;
        };
      };
      risk_snapshots: {
        Row: {
          id: string;
          student_id: string;
          risk_score: number;
          risk_level: string;
          reason_codes: string[];
          calculated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          risk_score: number;
          risk_level: string;
          reason_codes?: string[];
          calculated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          risk_score?: number;
          risk_level?: string;
          reason_codes?: string[];
          calculated_at?: string;
        };
      };
      session_templates: {
        Row: {
          id: string;
          title: string;
          focus_skills: string[];
          note_hint: string;
          duration_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          focus_skills?: string[];
          note_hint?: string;
          duration_minutes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          focus_skills?: string[];
          note_hint?: string;
          duration_minutes?: number;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          offline_id: string;
          student_id: string;
          mentor_id: string;
          template_id: string | null;
          session_date: string;
          started_at: string | null;
          duration_minutes: number;
          mode: string;
          attendance: string;
          engagement_level: number;
          confidence_delta: number;
          notes: string;
          learning_gaps: string[];
          skill_ratings: Json;
          sync_source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          offline_id: string;
          student_id: string;
          mentor_id: string;
          template_id?: string | null;
          session_date: string;
          started_at?: string | null;
          duration_minutes: number;
          mode: string;
          attendance: string;
          engagement_level: number;
          confidence_delta: number;
          notes: string;
          learning_gaps?: string[];
          skill_ratings: Json;
          sync_source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          offline_id?: string;
          student_id?: string;
          mentor_id?: string;
          template_id?: string | null;
          session_date?: string;
          started_at?: string | null;
          duration_minutes?: number;
          mode?: string;
          attendance?: string;
          engagement_level?: number;
          confidence_delta?: number;
          notes?: string;
          learning_gaps?: string[];
          skill_ratings?: Json;
          sync_source?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          preferred_name: string | null;
          age: number;
          grade: string;
          school_name: string | null;
          locality: string;
          migration_status: string;
          baseline_reading_level: number;
          baseline_arithmetic_level: number;
          attendance_rate: number;
          guardian_name: string;
          guardian_phone: string;
          preferred_language: string;
          sms_opt_in: boolean;
          last_session_at: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          preferred_name?: string | null;
          age: number;
          grade: string;
          school_name?: string | null;
          locality: string;
          migration_status?: string;
          baseline_reading_level?: number;
          baseline_arithmetic_level?: number;
          attendance_rate?: number;
          guardian_name: string;
          guardian_phone: string;
          preferred_language?: string;
          sms_opt_in?: boolean;
          last_session_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          preferred_name?: string | null;
          age?: number;
          grade?: string;
          school_name?: string | null;
          locality?: string;
          migration_status?: string;
          baseline_reading_level?: number;
          baseline_arithmetic_level?: number;
          attendance_rate?: number;
          guardian_name?: string;
          guardian_phone?: string;
          preferred_language?: string;
          sms_opt_in?: boolean;
          last_session_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

