/**
 * OPERADOR - MÓDULO DE PONTUAÇÃO (Core Domain)
 * Responsável por calcular e gerenciar pontuações
 * REQ 07 - Encerrar Quiz
 */

import * as kv from "./kv_store.tsx";
import type { QuizSession, UserProfile, FastestEntry } from "./types.tsx";

export class ScoringModule {
  /**
   * Finaliza uma sessão de quiz e calcula a pontuação final
   * REQ 07 - Encerrar Quiz
   */
  async finishQuiz(userId: string): Promise<{
    finalScore: number;
    totalQuestions: number;
    correctAnswers: number;
    durationMs: number;
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
    
    sessionData.status = 'completed';
    sessionData.completedAt = new Date().toISOString();

    await kv.set(sessionId, JSON.stringify(sessionData));
    await kv.del(`user:${userId}:active_session`);

    await this.updateUserScore(userId, sessionData.score);

    await this.trackFastestPlayer(sessionData);

    const rankingKey = `ranking:${Date.now()}:${userId}`;
    await kv.set(rankingKey, JSON.stringify({
      userId,
      sessionId,
      score: sessionData.score,
      completedAt: sessionData.completedAt
    }));

    const correctAnswers = sessionData.answers.filter(a => a.correct).length;

    const durationMs = sessionData.completedAt
      ? new Date(sessionData.completedAt).getTime() - new Date(sessionData.startedAt).getTime()
      : 0;

    return {
      finalScore: sessionData.score,
      totalQuestions: sessionData.questions.length,
      correctAnswers,
      durationMs
    };
  }

  /**
   * Atualiza a pontuação total do usuário
   */
  async updateUserScore(userId: string, scoreToAdd: number): Promise<void> {
    const userProfileStr = await kv.get(`user_profile:${userId}`);
    if (userProfileStr) {
      const userProfile: UserProfile = JSON.parse(userProfileStr);
      userProfile.totalScore += scoreToAdd;
      userProfile.gamesPlayed += 1;
      await kv.set(`user_profile:${userId}`, JSON.stringify(userProfile));
    }
  }

  /**
   * Obtém estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<{
    totalScore: number;
    gamesPlayed: number;
    averageScore: number;
  }> {
    const userProfileStr = await kv.get(`user_profile:${userId}`);
    if (!userProfileStr) {
      return {
        totalScore: 0,
        gamesPlayed: 0,
        averageScore: 0
      };
    }

    const userProfile: UserProfile = JSON.parse(userProfileStr);
    const averageScore = userProfile.gamesPlayed > 0 
      ? userProfile.totalScore / userProfile.gamesPlayed 
      : 0;

    return {
      totalScore: userProfile.totalScore,
      gamesPlayed: userProfile.gamesPlayed,
      averageScore: Math.round(averageScore * 10) / 10
    };
  }

  /**
   * Calcula pontuação de uma sessão específica
   */
  async getSessionScore(sessionId: string): Promise<number> {
    const sessionDataStr = await kv.get(sessionId);
    if (!sessionDataStr) {
      throw new Error('Session not found');
    }

    const sessionData: QuizSession = JSON.parse(sessionDataStr);
    return sessionData.score;
  }

  /**
   * REQ 13 - Registrar jogador mais rápido por quiz
   */
  private async trackFastestPlayer(sessionData: QuizSession): Promise<void> {
    const durationMs = sessionData.completedAt
      ? new Date(sessionData.completedAt).getTime() - new Date(sessionData.startedAt).getTime()
      : 0;
    const profileStr = await kv.get(`user_profile:${sessionData.userId}`);
    if (!profileStr) return;
    const profile: UserProfile = JSON.parse(profileStr);

    const entry: FastestEntry = {
      userId: sessionData.userId,
      name: profile.name,
      quizId: sessionData.quizId,
      durationMs,
      score: sessionData.score,
      completedAt: sessionData.completedAt || new Date().toISOString()
    };

    const key = `fastest:${sessionData.quizId}`;
    const currentStr = await kv.get(key);
    if (!currentStr) {
      await kv.set(key, JSON.stringify(entry));
      return;
    }

    const current: FastestEntry = JSON.parse(currentStr);
    const isFaster = durationMs > 0 && (current.durationMs === 0 || durationMs < current.durationMs);
    const isHigherScore = sessionData.score > current.score;
    if (isFaster || isHigherScore) {
      await kv.set(key, JSON.stringify(entry));
    }
  }

  async getFastestByQuiz(quizId: string): Promise<FastestEntry | null> {
    const key = `fastest:${quizId}`;
    const currentStr = await kv.get(key);
    return currentStr ? JSON.parse(currentStr) : null;
  }

  /**
   * Reset all fastest player records
   */
  async resetAllFastest(): Promise<void> {
    const keys = await kv.getKeysByPrefix('fastest:');
    if (keys.length > 0) {
      await kv.mdel(keys);
    }
  }
}
