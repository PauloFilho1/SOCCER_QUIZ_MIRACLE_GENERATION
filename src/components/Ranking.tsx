/**
 * TELA DE RANKING (LEADERBOARD)
 * 
 * Este componente exibe a classificação dos jogadores baseada em suas pontuações.
 * Ele também destaca o jogador mais rápido em cada quiz (Requisito Específico).
 * 
 * FUNCIONALIDADES:
 * - Listagem de Ranking Global
 * - Destaque para Top 3 (Ouro, Prata, Bronze)
 * - Visualização de "Jogador Mais Rápido" por Quiz
 * - Funcionalidade Administrativa de Reset de Ranking
 * 
 * ARQUITETURA:
 * - Data Fetching: Busca dados de múltiplos endpoints (/ranking, /quizzes, /fastest).
 * - Conditional Rendering: Exibe estados de carregamento, erro e lista vazia.
 * - Admin Controls: Botão de reset visível apenas para administradores.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Award, Medal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { quizzesService, QuizSummary } from '../services/quizzesService';
import { quizService } from '../services/quizService';
import { API_BASE_URL } from '../services/api';

interface RankingProps {
  onBack: () => void;
}

interface RankingEntry {
  position: number;
  userId: string;
  name: string;
  totalScore: number;
  gamesPlayed: number;
  average: string;
}

export function Ranking({ onBack }: RankingProps) {
  // Contexto de Autenticação
  const { accessToken, user } = useAuth();

  // Estado Local - Dados de Ranking
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado Local - Dados de "Mais Rápido"
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [fastest, setFastest] = useState<any | null>(null);
  
  // Estado de Controle
  const [resetting, setResetting] = useState(false);

  // Inicialização: Carrega ranking e lista de quizzes
  useEffect(() => {
    if (accessToken) {
      fetchRanking();
      loadQuizzes();
    }
  }, [accessToken]);

  // Efeito: Carrega o jogador mais rápido quando o quiz selecionado muda
  useEffect(() => {
    if (selectedQuizId) {
      fetchFastest(selectedQuizId);
    }
  }, [selectedQuizId]);

  /**
   * Busca o ranking global do servidor.
   */
  const fetchRanking = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/ranking`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Erro ao carregar ranking');
      } else {
        setRanking(data.ranking);
      }
    } catch (error) {
      console.error('Error fetching ranking:', error);
      setError('Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega a lista de quizzes para o filtro de "Mais Rápido".
   */
  const loadQuizzes = async () => {
    if (!accessToken) return;
    try {
      const data = await quizzesService.list(accessToken);
      const list = data.quizzes || [];
      setQuizzes(list);
      if (list.length) {
        setSelectedQuizId(list[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar quizzes', err);
    }
  };

  /**
   * Busca o registro do jogador mais rápido para um quiz específico.
   */
  const fetchFastest = async (quizId: string) => {
    if (!accessToken) return;
    try {
      const data = await quizService.getFastest(accessToken, quizId);
      setFastest(data.fastest || null);
    } catch (err) {
      console.error('Erro ao buscar mais rápido', err);
      setFastest(null);
    }
  };

  /**
   * Reseta todo o ranking do sistema (Apenas Admin).
   */
  const handleResetRanking = async () => {
    if (!accessToken || !user || user.role !== 'admin') return;
    if (!confirm('Tem certeza que deseja resetar TODO o ranking? Esta ação não pode ser desfeita!')) return;
    
    setResetting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ranking/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao resetar ranking');
      }

      await fetchRanking();
      if (selectedQuizId) {
        await fetchFastest(selectedQuizId);
      }
      alert('Ranking resetado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao resetar ranking:', err);
      alert(err.message || 'Erro ao resetar ranking');
    } finally {
      setResetting(false);
    }
  };

  // Helpers de UI para ícones e cores baseados na posição
  const getIcon = (position: number) => {
    if (position === 1) {
      return <Trophy className="w-8 h-8 text-yellow-500" />;
    }
    if (position === 2) {
      return <Award className="w-8 h-8 text-gray-400" />;
    }
    if (position === 3) {
      return <Medal className="w-8 h-8 text-orange-600" />;
    }
    return <span className="text-gray-400 text-xl">{position}</span>;
  };

  const getBorderColor = (position: number) => {
    if (position === 1) return 'border-green-500 border-2 bg-green-50/30';
    if (position === 2) return 'border-green-400 border-2 bg-green-50/20';
    if (position === 3) return 'border-green-300 border-2 bg-green-50/10';
    return 'border-gray-200 border';
  };

  return (
    <div className="min-h-screen bg-[#E8F5E6] p-4 pb-8">
      {/* Header com botão Voltar e Controles Admin */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-gray-200/50 text-gray-700 px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={handleResetRanking}
            disabled={resetting}
            style={{ backgroundColor: resetting ? '#9ca3af' : '#dc2626', color: '#ffffff' }}
            className="px-6 py-2 rounded-xl transition-all disabled:cursor-not-allowed cursor-pointer font-medium shadow-md hover:shadow-lg hover:opacity-90"
          >
            {resetting ? 'Resetando...' : 'Resetar Ranking'}
          </button>
        )}
      </div>

      {/* Card de Ranking */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* Título */}
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-600" />
          <h1 className="text-gray-900">Ranking dos Melhores</h1>
        </div>

        {/* Estado de Carregamento */}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            Carregando ranking...
          </div>
        )}

        {/* Estado de Erro */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchRanking}
              className="bg-[#5DA952] hover:bg-[#4F9844] text-white px-6 py-2 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Estado Vazio */}
        {!loading && !error && ranking.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum jogador no ranking ainda. Seja o primeiro a jogar!
          </div>
        )}

        {/* Lista de Jogadores */}
        {!loading && !error && ranking.length > 0 && (
          <div className="space-y-4">
            {ranking.map((player) => (
              <div
                key={player.userId}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${getBorderColor(
                  player.position
                )}`}
              >
                {/* Ícone/Posição */}
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {getIcon(player.position)}
                </div>

                {/* Informações do Jogador */}
                <div className="flex-1">
                  <h3 className="text-gray-900">{player.name}</h3>
                  <p className="text-gray-500 text-sm">{player.gamesPlayed} jogos</p>
                </div>

                {/* Pontuação */}
                <div className="text-right">
                  <div className="text-[#5DA952] text-2xl">{player.totalScore}</div>
                  <p className="text-gray-400 text-sm">Média: {player.average}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seção: Jogador mais rápido (Requisito 13) */}
        {quizzes.length > 0 && (
          <div className="mt-8 border-t pt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-gray-900">Jogador mais rápido</h3>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>

            {fastest ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                <div className="text-gray-900 font-semibold">{fastest.name}</div>
                <div className="text-sm text-gray-700">Tempo: {(fastest.durationMs / 1000).toFixed(1)}s</div>
                <div className="text-sm text-gray-700">Pontuação: {fastest.score}</div>
                <div className="text-xs text-gray-500">{new Date(fastest.completedAt).toLocaleString()}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Nenhum tempo registrado para este quiz.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
