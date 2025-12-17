export interface User {
  id: string;
  email: string;
  name: string;
  role: 'player' | 'admin';
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  team: string;
  createdBy: string;
  createdAt: string;
}

export interface QuizSession {
  sessionId: string;
  userId: string;
  quizId: string;
  team: string;
  questions: Question[];
  currentQuestion: number;
  score: number;
  answers: Answer[];
  startedAt: string;
  status: 'active' | 'completed';
  completedAt?: string;
}

export interface Answer {
  questionId: string;
  answer: string;
  correct: boolean;
  points: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  totalScore: number;
  gamesPlayed: number;
}

export interface RankingEntry {
  position: number;
  userId: string;
  name: string;
  totalScore: number;
  gamesPlayed: number;
  average: string;
}

export interface Quiz {
  id: string;
  name: string;
  description?: string;
  team: string;
  questionIds: string[];
  createdBy: string;
  createdAt: string;
  timeLimit?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'new_quiz';
  title: string;
  message: string;
  createdAt: string;
}

export interface Invite {
  id: string;
  email: string;
  invitedBy: string;
  token: string;
  createdAt: string;
}

export interface FastestEntry {
  userId: string;
  name: string;
  quizId: string;
  durationMs: number;
  score: number;
  completedAt: string;
}
