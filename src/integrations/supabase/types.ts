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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          conversation_id: number | null
          created_at: string
          deleted_at: string | null
          doctor_id: number | null
          duration_minutes: number | null
          id: number
          notes: string | null
          patient_id: number
          reason: string | null
          scheduled_at: string
          status: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          conversation_id?: number | null
          created_at?: string
          deleted_at?: string | null
          doctor_id?: number | null
          duration_minutes?: number | null
          id?: number
          notes?: string | null
          patient_id: number
          reason?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          conversation_id?: number | null
          created_at?: string
          deleted_at?: string | null
          doctor_id?: number | null
          duration_minutes?: number | null
          id?: number
          notes?: string | null
          patient_id?: number
          reason?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_appointment_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          context: string | null
          conversation_id: number
          created_at: string
          deleted_at: string | null
          duration: string | null
          id: number
          intensity: string | null
          onset: string | null
          possible_causes: string | null
          recommendations: string | null
          recurrence: string | null
          red_flags: string | null
          severity_level: string
          symptom_description: string | null
          triggers: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          context?: string | null
          conversation_id: number
          created_at?: string
          deleted_at?: string | null
          duration?: string | null
          id?: number
          intensity?: string | null
          onset?: string | null
          possible_causes?: string | null
          recommendations?: string | null
          recurrence?: string | null
          red_flags?: string | null
          severity_level: string
          symptom_description?: string | null
          triggers?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          context?: string | null
          conversation_id?: number
          created_at?: string
          deleted_at?: string | null
          duration?: string | null
          id?: number
          intensity?: string | null
          onset?: string | null
          possible_causes?: string | null
          recommendations?: string | null
          recurrence?: string | null
          red_flags?: string | null
          severity_level?: string
          symptom_description?: string | null
          triggers?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_assessment_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: number | null
          deleted_at: string | null
          external_conversation_id: string | null
          id: number
          initial_symptom: string | null
          monitoring_instructions: string | null
          patient_id: number
          questions_for_doctor: string | null
          recommendations: string | null
          severity_level: string | null
          status: string
          summary: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          external_conversation_id?: string | null
          id?: number
          initial_symptom?: string | null
          monitoring_instructions?: string | null
          patient_id: number
          questions_for_doctor?: string | null
          recommendations?: string | null
          severity_level?: string | null
          status?: string
          summary?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          external_conversation_id?: string | null
          id?: number
          initial_symptom?: string | null
          monitoring_instructions?: string | null
          patient_id?: number
          questions_for_doctor?: string | null
          recommendations?: string | null
          severity_level?: string | null
          status?: string
          summary?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversation_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      flyway_schema_history: {
        Row: {
          checksum: number | null
          description: string
          execution_time: number
          installed_by: string
          installed_on: string
          installed_rank: number
          script: string
          success: boolean
          type: string
          version: string | null
        }
        Insert: {
          checksum?: number | null
          description: string
          execution_time: number
          installed_by: string
          installed_on?: string
          installed_rank: number
          script: string
          success: boolean
          type: string
          version?: string | null
        }
        Update: {
          checksum?: number | null
          description?: string
          execution_time?: number
          installed_by?: string
          installed_on?: string
          installed_rank?: number
          script?: string
          success?: boolean
          type?: string
          version?: string | null
        }
        Relationships: []
      }
      medical_documents: {
        Row: {
          content_type: string
          created_at: string
          deleted_at: string | null
          description: string | null
          document_type: string
          extracted_text: string | null
          file_data: string
          file_name: string
          file_size: number
          id: number
          patient_id: number
          processed: boolean
          updated_at: string | null
          uploaded_at: string
          version: number | null
        }
        Insert: {
          content_type: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          document_type: string
          extracted_text?: string | null
          file_data: string
          file_name: string
          file_size: number
          id?: number
          patient_id: number
          processed?: boolean
          updated_at?: string | null
          uploaded_at?: string
          version?: number | null
        }
        Update: {
          content_type?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          document_type?: string
          extracted_text?: string | null
          file_data?: string
          file_name?: string
          file_size?: number
          id?: number
          patient_id?: number
          processed?: boolean
          updated_at?: string | null
          uploaded_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_medical_document_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: number
          created_at: string
          deleted_at: string | null
          id: number
          response_time_ms: number | null
          tokens_used: number | null
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          conversation_id: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          response_time_ms?: number | null
          tokens_used?: number | null
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          conversation_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          response_time_ms?: number | null
          tokens_used?: number | null
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_message_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          city: string | null
          country: string | null
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          deleted_at: string | null
          document_number: string | null
          document_type: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: number
          medical_history: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          user_id: number
          version: number | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          document_number?: string | null
          document_type?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: number
          medical_history?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: number
          version?: number | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          document_number?: string | null
          document_type?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: number
          medical_history?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: number
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      symptoms: {
        Row: {
          assessment_id: number
          created_at: string
          deleted_at: string | null
          description: string | null
          duration: string | null
          id: number
          intensity: string | null
          is_primary: boolean | null
          location: string | null
          name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          assessment_id: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          id?: number
          intensity?: string | null
          is_primary?: boolean | null
          location?: string | null
          name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          assessment_id?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          id?: number
          intensity?: string | null
          is_primary?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_symptom_assessment"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string
          id: number
          is_active: boolean
          last_login_at: string | null
          last_name: string
          password_hash: string
          phone: string | null
          role: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name: string
          id?: number
          is_active?: boolean
          last_login_at?: string | null
          last_name: string
          password_hash: string
          phone?: string | null
          role: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string
          id?: number
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          password_hash?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_family_patient: {
        Args: {
          p_birth_date: string
          p_dni: string
          p_first_name: string
          p_gender?: string
          p_height?: number
          p_last_name: string
          p_relationship?: string
          p_weight?: number
        }
        Returns: Json
      }
      create_main_patient: {
        Args: {
          p_birth_date: string
          p_dni: string
          p_email?: string
          p_first_name: string
          p_gender: string
          p_height: number
          p_last_name: string
          p_phone?: string
          p_user_id: string
          p_weight: number
        }
        Returns: Json
      }
      upsert_profile: {
        Args: {
          p_birth_date: string
          p_dni: string
          p_gender: string
          p_height: number
          p_name: string
          p_surname: string
          p_user_id: string
          p_weight: number
        }
        Returns: Json
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
