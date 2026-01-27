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
      bus_companies: {
        Row: {
          address: string | null
          average_rating: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          logo_url: string | null
          name: string
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          logo_url?: string | null
          name: string
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          logo_url?: string | null
          name?: string
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      buses: {
        Row: {
          amenities: string[] | null
          company_id: string
          created_at: string
          id: string
          is_available: boolean | null
          model: string | null
          registration_number: string
          seat_capacity: number
          status: string | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          company_id: string
          created_at?: string
          id?: string
          is_available?: boolean | null
          model?: string | null
          registration_number: string
          seat_capacity?: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          company_id?: string
          created_at?: string
          id?: string
          is_available?: boolean | null
          model?: string | null
          registration_number?: string
          seat_capacity?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_admins: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_admins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          assigned_bus_id: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          license_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_bus_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_bus_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_assigned_bus_id_fkey"
            columns: ["assigned_bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          is_approved: boolean | null
          rating: number
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          rating: number
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          rating?: number
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          company_id: string
          created_at: string
          destination: string
          distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          map_coordinates: Json | null
          origin: string
          stops: string[] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          destination: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          map_coordinates?: Json | null
          origin: string
          stops?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          destination?: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          map_coordinates?: Json | null
          origin?: string
          stops?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          arrival_time: string | null
          bus_id: string
          created_at: string
          days_of_week: number[] | null
          departure_time: string
          id: string
          is_active: boolean | null
          price_leones: number
          route_id: string
          updated_at: string
        }
        Insert: {
          arrival_time?: string | null
          bus_id: string
          created_at?: string
          days_of_week?: number[] | null
          departure_time: string
          id?: string
          is_active?: boolean | null
          price_leones: number
          route_id: string
          updated_at?: string
        }
        Update: {
          arrival_time?: string | null
          bus_id?: string
          created_at?: string
          days_of_week?: number[] | null
          departure_time?: string
          id?: string
          is_active?: boolean | null
          price_leones?: number
          route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          created_at: string
          id: string
          scan_location: string | null
          scan_result: string
          scanned_by: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scan_location?: string | null
          scan_result: string
          scanned_by: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scan_location?: string | null
          scan_result?: string
          scanned_by?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          passenger_id: string | null
          passenger_name: string
          passenger_phone: string
          payment_reference: string | null
          payment_status: string | null
          price_paid: number
          purchased_at: string
          qr_code: string | null
          scanned_at: string | null
          scanned_by: string | null
          seat_number: number
          status: string | null
          ticket_code: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passenger_id?: string | null
          passenger_name: string
          passenger_phone: string
          payment_reference?: string | null
          payment_status?: string | null
          price_paid: number
          purchased_at?: string
          qr_code?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          seat_number: number
          status?: string | null
          ticket_code: string
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          passenger_id?: string | null
          passenger_name?: string
          passenger_phone?: string
          payment_reference?: string | null
          payment_status?: string | null
          price_paid?: number
          purchased_at?: string
          qr_code?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          seat_number?: number
          status?: string | null
          ticket_code?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          available_seats: number
          created_at: string
          id: string
          schedule_id: string
          status: string | null
          trip_date: string
          updated_at: string
        }
        Insert: {
          available_seats: number
          created_at?: string
          id?: string
          schedule_id: string
          status?: string | null
          trip_date: string
          updated_at?: string
        }
        Update: {
          available_seats?: number
          created_at?: string
          id?: string
          schedule_id?: string
          status?: string | null
          trip_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "company_admin" | "driver" | "passenger"
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
      app_role: ["admin", "company_admin", "driver", "passenger"],
    },
  },
} as const
