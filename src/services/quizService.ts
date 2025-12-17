/**
 * SERVIÇO DE SESSÃO DE QUIZ
 * 
 * Gerencia o estado ativo de um quiz sendo jogado pelo usuário.
 * Controla o fluxo: Início -> Pergunta Atual -> Resposta -> Finalização.
 * 
 * PADRÕES:
 * - Service Object: Centraliza a lógica de sessão de jogo.
 * - State Management: Interage com endpoints que mantêm o estado do jogo no servidor.
 * - Adapter: Padroniza respostas da API.
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';

export const quizService = {
    /**
     * Inicia uma nova sessão de quiz.
     * 
     * @param token Token de autenticação
     * @param quizId ID do quiz a ser iniciado
     * @param team (Opcional) Time associado (legado/compatibilidade)
     */
    async startQuiz(token: string, quizId: string, team: string = 'general') {
        if (!quizId) throw new Error('quizId é obrigatório');
        const response = await fetch(`${API_BASE_URL}/quiz/start`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify({ team, quizId }),
        });
        return handleResponse(response);
    },

    /**
     * Obtém a pergunta atual da sessão ativa.
     * Útil para retomar um quiz em andamento (persistência de estado).
     */
    async getCurrentQuestion(token: string) {
        const response = await fetch(`${API_BASE_URL}/quiz/current`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Envia a resposta para a pergunta atual.
     * O backend processa a resposta e avança o estado do jogo.
     */
    async answerQuestion(token: string, answer: string) {
        const response = await fetch(`${API_BASE_URL}/quiz/answer`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify({ answer }),
        });
        return handleResponse(response);
    },

    /**
     * Finaliza a sessão do quiz e calcula a pontuação final.
     */
    async finishQuiz(token: string) {
        const response = await fetch(`${API_BASE_URL}/quiz/finish`, {
            method: 'POST',
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Busca o recorde de tempo (jogador mais rápido) para um quiz específico.
     * Utilizado na tela de Ranking.
     */
    async getFastest(token: string, quizId: string) {
        const response = await fetch(`${API_BASE_URL}/ranking/fastest/${quizId}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    }
};
