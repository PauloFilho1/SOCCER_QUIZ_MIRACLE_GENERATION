/**
 * OPERADOR - MÓDULO DE SESSÃO DE QUIZ (Core Domain)
 * Responsável por gerenciar o ciclo de vida das sessões de quiz
 * REQ 06 - Disputar Quiz
 */

import * as kv from "./kv_store.tsx";
import type { Question, QuizSession, Answer, Quiz } from "./types.tsx";

export class QuizSessionModule {
  /**
   * Inicia uma nova sessão de quiz para um usuário
   */
  async startSession(userId: string, quizId: string, team?: string): Promise<{ sessionId: string; totalQuestions: number; quizId: string; timeLimit: number }> {
    if (!quizId) {
      throw new Error('Quiz is required');
    }

    const quizStr = await kv.get(quizId);
    if (!quizStr) {
      throw new Error('Quiz not found');
    }

    const quiz: Quiz = JSON.parse(quizStr);
    if (!quiz.questionIds.length) {
      throw new Error('No questions available for this quiz');
    }

    const questions = await kv.mget(quiz.questionIds);
    const parsedQuestions: Question[] = questions
      .filter((q) => q !== null)
      .map((q) => JSON.parse(q as string))
      .filter((q) => !team || q.team === team || q.team === 'general');

    if (parsedQuestions.length === 0) {
      throw new Error('No questions available for this team');
    }

    const shuffledQuestions = this.shuffleArray(parsedQuestions);

    const sessionId = `session:${userId}:${quizId}:${Date.now()}`;
    const sessionData: QuizSession = {
      sessionId,
      userId,
      quizId,
      team: team || quiz.team || 'general',
      questions: shuffledQuestions,
      currentQuestion: 0,
      score: 0,
      answers: [],
      startedAt: new Date().toISOString(),
      status: 'active'
    };

    await kv.set(sessionId, JSON.stringify(sessionData));
    await kv.set(`user:${userId}:active_session`, sessionId);

    return {
      sessionId,
      totalQuestions: shuffledQuestions.length,
      quizId,
      timeLimit: quiz.timeLimit || 30
    };
  }

  /**
   * Obtém a pergunta atual da sessão
   */
  async getCurrentQuestion(userId: string): Promise<{
    question: { id: string; question: string; options: string[] };
    currentQuestion: number;
    totalQuestions: number;
    score: number;
  }> {
    const sessionId = await kv.get(`user:${userId}:active_session`);
    if (!sessionId) {
      throw new Error('No active quiz session');
    }

    const sessionDataStr = await kv.get(sessionId);
    if (!sessionDataStr) {
      throw new Error('Session not found');
    }

    const sessionData: QuizSession = JSON.parse(sessionDataStr);
    
    if (sessionData.status !== 'active') {
      throw new Error('Quiz session is not active');
    }

    const currentQuestion = sessionData.questions[sessionData.currentQuestion];
    if (!currentQuestion) {
      throw new Error('No more questions');
    }

    return {
      question: {
        id: currentQuestion.id,
        question: currentQuestion.question,
        options: currentQuestion.options
      },
      currentQuestion: sessionData.currentQuestion + 1,
      totalQuestions: sessionData.questions.length,
      score: sessionData.score
    };
  }

  /**
   * Submete uma resposta para a pergunta atual
   */
  async submitAnswer(userId: string, answer: string): Promise<{
    correct: boolean;
    correctAnswer: string;
    points: number;
    totalScore: number;
    hasMoreQuestions: boolean;
  }> {
    const sessionId = await kv.get(`user:${userId}:active_session`);
    if (!sessionId) {
      throw new Error('No active quiz session');
    }

    const sessionDataStr = await kv.get(sessionId);
    if (!sessionDataStr) {
      throw new Error('Session not found');
    }

    const sessionData: QuizSession = JSON.parse(sessionDataStr);
    const currentQuestion = sessionData.questions[sessionData.currentQuestion];
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect ? 100 : 0;

    sessionData.score += pointsEarned;
    sessionData.answers.push({
      questionId: currentQuestion.id,
      answer,
      correct: isCorrect,
      points: pointsEarned
    });
    sessionData.currentQuestion += 1;

    const hasMoreQuestions = sessionData.currentQuestion < sessionData.questions.length;

    await kv.set(sessionId, JSON.stringify(sessionData));

    return {
      correct: isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      points: pointsEarned,
      totalScore: sessionData.score,
      hasMoreQuestions
    };
  }

  /**
   * Obtém informações sobre uma sessão
   */
  async getSession(sessionId: string): Promise<QuizSession> {
    const sessionDataStr = await kv.get(sessionId);
    if (!sessionDataStr) {
      throw new Error('Session not found');
    }
    return JSON.parse(sessionDataStr);
  }

  /**
   * Verifica se usuário tem sessão ativa
   */
  async hasActiveSession(userId: string): Promise<boolean> {
    const sessionId = await kv.get(`user:${userId}:active_session`);
    return !!sessionId;
  }

  /**
   * Utility: Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
