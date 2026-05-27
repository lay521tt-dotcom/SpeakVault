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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      mastery_status: MasteryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
