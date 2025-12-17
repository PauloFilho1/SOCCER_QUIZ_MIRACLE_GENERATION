/**
 * OPERADOR - MÓDULO DE RANKING (Core Domain)
 * Responsável por gerenciar e calcular rankings
 * REQ 08 - Visualizar Ranking
 * 
 * Implementa táticas de cache para alta disponibilidade e elasticidade
 */

import * as kv from "./kv_store.tsx";
import type { UserProfile, RankingEntry } from "./types.tsx";

export class RankingModule {
  private static CACHE_KEY = 'ranking:cache';
  private static CACHE_TTL_MS = 30000;
  private static CACHE_TIMESTAMP_KEY = 'ranking:cache:timestamp';

  /**
   * Obtém o ranking global de jogadores
   * REQ 08 - Visualizar Ranking
   * 
   * Implementa cache para otimizar performance (Elasticidade)
   */
  async getGlobalRanking(): Promise<RankingEntry[]> {
    const cachedRanking = await this.getRankingFromCache();
    if (cachedRanking) {
      return cachedRanking;
    }

    const ranking = await this.calculateRanking();
    
    await this.cacheRanking(ranking);

    return ranking;
  }

  /**
   * Calcula o ranking a partir dos perfis de usuários
   */
  private async calculateRanking(): Promise<RankingEntry[]> {
    const allKeys = await kv.getByPrefix('user_profile:');
    const profiles: UserProfile[] = allKeys
      .map(item => JSON.parse(item))
      .filter(profile => profile.gamesPlayed > 0);

    profiles.sort((a, b) => b.totalScore - a.totalScore);

    const ranking: RankingEntry[] = profiles.map((profile, index) => ({
      position: index + 1,
      userId: profile.id,
      name: profile.name,
      totalScore: profile.totalScore,
      gamesPlayed: profile.gamesPlayed,
      average: profile.gamesPlayed > 0 
        ? (profile.totalScore / profile.gamesPlayed).toFixed(1) 
        : '0.0'
    }));

    return ranking;
  }

  /**
   * Obtém ranking do cache se ainda válido
   */
  private async getRankingFromCache(): Promise<RankingEntry[] | null> {
    const cachedRankingStr = await kv.get(RankingModule.CACHE_KEY);
    const timestampStr = await kv.get(RankingModule.CACHE_TIMESTAMP_KEY);

    if (!cachedRankingStr || !timestampStr) {
      return null;
    }

    const timestamp = parseInt(timestampStr);
    const now = Date.now();

    if (now - timestamp > RankingModule.CACHE_TTL_MS) {
      return null;
    }

    return JSON.parse(cachedRankingStr);
  }

  /**
   * Armazena ranking no cache
   */
  private async cacheRanking(ranking: RankingEntry[]): Promise<void> {
    await kv.set(RankingModule.CACHE_KEY, JSON.stringify(ranking));
    await kv.set(RankingModule.CACHE_TIMESTAMP_KEY, Date.now().toString());
  }

  /**
   * Invalida o cache do ranking (chamado após finalizar quiz)
   */
  async invalidateCache(): Promise<void> {
    await kv.del(RankingModule.CACHE_KEY);
    await kv.del(RankingModule.CACHE_TIMESTAMP_KEY);
  }

  /**
   * Obtém a posição de um usuário específico no ranking
   */
  async getUserPosition(userId: string): Promise<number | null> {
    const ranking = await this.getGlobalRanking();
    const entry = ranking.find(r => r.userId === userId);
    return entry ? entry.position : null;
  }

  /**
   * Obtém o top N do ranking
   */
  async getTopPlayers(limit: number = 10): Promise<RankingEntry[]> {
    const ranking = await this.getGlobalRanking();
    return ranking.slice(0, limit);
  }

  /**
   * Obtém estatísticas gerais do ranking
   */
  async getRankingStats(): Promise<{
    totalPlayers: number;
    averageScore: number;
    highestScore: number;
  }> {
    const ranking = await this.getGlobalRanking();
    
    if (ranking.length === 0) {
      return {
        totalPlayers: 0,
        averageScore: 0,
        highestScore: 0
      };
    }

    const totalScore = ranking.reduce((sum, entry) => sum + entry.totalScore, 0);
    const averageScore = totalScore / ranking.length;
    const highestScore = ranking[0]?.totalScore || 0;

    return {
      totalPlayers: ranking.length,
      averageScore: Math.round(averageScore * 10) / 10,
      highestScore
    };
  }

  /**
   * Reseta todos os rankings zerando totalScore e gamesPlayed de todos os usuários
   * Apenas administradores podem executar esta ação
   */
  async resetAllRankings(): Promise<void> {
    const allKeys = await kv.getByPrefix('user_profile:');
    const profiles: UserProfile[] = allKeys.map(item => JSON.parse(item));

    for (const profile of profiles) {
      const updatedProfile: UserProfile = {
        ...profile,
        totalScore: 0,
        gamesPlayed: 0
      };
      await kv.set(`user_profile:${profile.id}`, JSON.stringify(updatedProfile));
    }

    await this.invalidateCache();
  }
}
