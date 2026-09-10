// Database types matching the SQL schema (snake_case column names)

export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  gender: "male" | "female" | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type MCUUploadStatus = "pending" | "processing" | "completed" | "failed"

export type MCUUpload = {
  id: string
  user_id: string | null
  upload_token: string
  file_url: string
  file_name: string
  file_type: string | null
  status: MCUUploadStatus
  is_claimed: boolean
  uploaded_at: string
  claimed_at: string | null
}

export type MCUResultStatus = "normal" | "warning" | "critical"

export type MCUResult = {
  id: string
  upload_id: string | null
  user_id: string | null
  category: string
  parameter_name: string
  value: number | null
  unit: string | null
  normal_range_min: number | null
  normal_range_max: number | null
  status: MCUResultStatus | null
  notes: string | null
  checked_at: string
}

export type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  category: string
  tags: string[] | null
  is_premium: boolean
  read_time_minutes: number
  author: string
  published_at: string
  created_at: string
}

export type QuizQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "scale"
  | "text_input"

export type QuizOption = {
  label: string
  value: string
  score?: number
}

export type Quiz = {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  category: string
  quiz_type: string
  is_active: boolean
  created_at: string
}

export type QuizQuestion = {
  id: string
  quiz_id: string | null
  question_text: string
  question_type: QuizQuestionType
  options: QuizOption[] | null
  order_index: number
  is_required: boolean
}

export type QuizResponse = {
  id: string
  quiz_id: string | null
  user_id: string | null
  answers: Record<string, unknown>
  result: Record<string, unknown> | null
  completed_at: string
}

// Utility types

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at">
export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at" | "updated_at">>

export type MCUUploadInsert = Omit<MCUUpload, "id" | "uploaded_at">
export type MCUResultInsert = Omit<MCUResult, "id" | "checked_at">

export type QuizResponseInsert = Omit<QuizResponse, "id" | "completed_at">
