/**
 * SERVIÇO DE QUESTÕES
 * 
 * Gerencia o ciclo de vida das perguntas (criação, listagem, exclusão).
 * 
 * PADRÕES:
 * - Service Object: Centraliza as operações de API relacionadas a questões.
 * - DTO: Define a estrutura de dados para criação de questões (CreateQuestionDTO).
 * - CRUD Interface: Implementa operações padrão de Create, Read, Delete.
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface CreateQuestionDTO {
    question: string;
    options: string[];
    correctAnswer: string;
    team: string;
    quizId: string;
}

export const questionService = {
    /**
     * Busca questões, opcionalmente filtradas por Quiz.
     * 
     * @param token Token de autenticação
     * @param quizId (Opcional) ID do quiz para filtrar as questões
     */
    async getQuestions(token: string, quizId?: string) {
        const url = new URL(`${API_BASE_URL}/questions`);
        if (quizId) {
            url.searchParams.set('quizId', quizId);
        }
        const response = await fetch(url.toString(), {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Cria uma nova questão no banco de dados.
     * 
     * @param token Token de autenticação (admin)
     * @param data Dados da nova questão
     */
    async createQuestion(token: string, data: CreateQuestionDTO) {
        const response = await fetch(`${API_BASE_URL}/questions`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    /**
     * Remove uma questão existente.
     * 
     * @param token Token de autenticação (admin)
     * @param questionId ID da questão a ser removida
     */
    async deleteQuestion(token: string, questionId: string) {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: 'DELETE',
            headers: getHeaders(token),
        });
        if (response.status === 204) return null;
        return handleResponse(response);
    },
};
