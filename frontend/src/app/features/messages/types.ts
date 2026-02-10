// src/app/features/messages/types.ts

export type TargetType = "SINGLE" | "MULTI" | "ALL";

export interface RecipientInfo {
  id: number;
  name: string | null;
  email: string;
}

export interface MessageLog {
  id: number;
  subject: string | null;
  message: string;
  createdAt: string;
  targetType: TargetType;
  recipients: RecipientInfo[];
}

export interface MessageStats {
  totalMessages: number;
  broadcastCount: number;
  directCount: number;
  last7DaysCount: number;
}
