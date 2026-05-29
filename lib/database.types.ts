export type MasteryStatus = "New" | "Practising" | "Struggling" | "Mastered";

export type Expression = {
  id: string;
  user_id: string;
  english: string;
  chinese: string;
  category: string;
  difficulty: string;
  status: MasteryStatus;
  tags: string[];
  note: string;
  alternatives: string[];
  created_at: string;
  updated_at: string;
};

export type ExpressionInsert = Omit<Expression, "id" | "user_id" | "created_at" | "updated_at">;

export type PracticeSession = {
  id: string;
  user_id: string;
  expression_id: string | null;
  transcript: string;
  input_mode: "voice" | "typed" | null;
  audio_duration_ms: number | null;
  pronunciation_score: number;
  accent_score: number | null;
  fluency_score: number | null;
  naturalness_score: number;
  completeness_score: number;
  feedback_summary: string | null;
  accent_focus: string | null;
  pronunciation_drill: string | null;
  audio_note: string | null;
  better_version: string | null;
  next_step: string | null;
  created_at: string;
};

export type PracticeSessionWithExpression = PracticeSession & {
  expressions: Pick<Expression, "id" | "english" | "chinese" | "category" | "difficulty"> | null;
};

export type Database = {
  public: {
    Tables: {
      expressions: {
        Row: Expression;
        Insert: {
          id?: string;
          user_id?: string;
          english: string;
          chinese: string;
          category: string;
          difficulty: string;
          status?: MasteryStatus;
          tags?: string[];
          note?: string;
          alternatives?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          english: string;
          chinese: string;
          category: string;
          difficulty: string;
          status: MasteryStatus;
          tags: string[];
          note: string;
          alternatives: string[];
          updated_at: string;
        }>;
        Relationships: [];
      };
      practice_sessions: {
        Row: PracticeSession;
        Insert: {
          id?: string;
          user_id?: string;
          expression_id?: string | null;
          transcript: string;
          input_mode?: "voice" | "typed" | null;
          audio_duration_ms?: number | null;
          pronunciation_score: number;
          accent_score?: number | null;
          fluency_score?: number | null;
          naturalness_score: number;
          completeness_score: number;
          feedback_summary?: string | null;
          accent_focus?: string | null;
          pronunciation_drill?: string | null;
          audio_note?: string | null;
          better_version?: string | null;
          next_step?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          transcript: string;
          input_mode: "voice" | "typed" | null;
          audio_duration_ms: number | null;
          pronunciation_score: number;
          accent_score: number | null;
          fluency_score: number | null;
          naturalness_score: number;
          completeness_score: number;
          feedback_summary: string | null;
          accent_focus: string | null;
          pronunciation_drill: string | null;
          audio_note: string | null;
          better_version: string | null;
          next_step: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      mastery_status: MasteryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
