export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nickname: string | null
          avatar_url: string | null
          api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname?: string | null
          avatar_url?: string | null
          api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string | null
          avatar_url?: string | null
          api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      scripts: {
        Row: {
          id: string
          project_id: string
          content: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          content?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          content?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      shots: {
        Row: {
          id: string
          script_id: string
          shot_number: number
          description: string | null
          camera_movement: string | null
          start_frame_url: string | null
          end_frame_url: string | null
          video_url: string | null
          video_status: string | null
          video_task_id: string | null
          prompt: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          script_id: string
          shot_number: number
          description?: string | null
          camera_movement?: string | null
          start_frame_url?: string | null
          end_frame_url?: string | null
          video_url?: string | null
          video_status?: string | null
          video_task_id?: string | null
          prompt?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          script_id?: string
          shot_number?: number
          description?: string | null
          camera_movement?: string | null
          start_frame_url?: string | null
          end_frame_url?: string | null
          video_url?: string | null
          video_status?: string | null
          video_task_id?: string | null
          prompt?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          reference_images: Json
          variants: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          reference_images?: Json
          variants?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          reference_images?: Json
          variants?: Json
          created_at?: string
          updated_at?: string
        }
      }
      scenes: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          reference_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          reference_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          reference_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      video_tasks: {
        Row: {
          id: string
          shot_id: string
          task_id: string
          provider: string
          model: string
          status: string
          result_url: string | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          shot_id: string
          task_id: string
          provider: string
          model: string
          status?: string
          result_url?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          shot_id?: string
          task_id?: string
          provider?: string
          model?: string
          status?: string
          result_url?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Script = Database['public']['Tables']['scripts']['Row']
export type Shot = Database['public']['Tables']['shots']['Row']
export type Character = Database['public']['Tables']['characters']['Row']
export type Scene = Database['public']['Tables']['scenes']['Row']
export type VideoTask = Database['public']['Tables']['video_tasks']['Row']
