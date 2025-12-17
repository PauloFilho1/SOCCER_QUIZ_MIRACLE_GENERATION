/**
 * SERVIÇO DE QUIZZES (QUIZZES SERVICE)
 * 
 * Este módulo implementa a camada de serviço para gerenciamento de quizzes.
 * Ele atua como uma fachada (Facade) para as operações de API relacionadas a quizzes,
 * abstraindo a complexidade das chamadas HTTP e tratamento de respostas.
 * 
 * PADRÕES UTILIZADOS:
 * - Service Object: Encapsulamento de lógica de negócios relacionada a quizzes.
 * - DTO (Data Transfer Object): Definição de interfaces para transferência de dados.
 * - Adapter: Adaptação das chamadas HTTP para métodos de serviço tipados.
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';

/**
 * DTO para criação de um novo quiz.
 * Define a estrutura de dados esperada pelo backend.
 */
export interface CreateQuizDTO {
  name: string;
  description?: string;
  team?: string;
  timeLimit?: number;
}

/**
 * Interface que representa o resumo de um quiz.
 * Utilizada para listagens e visualizações simplificadas.
 */
export interface QuizSummary {
  id: string;
  name: string;
  description?: string;
  team: string;
  questionIds?: string[];
  timeLimit?: number;
}

export const quizzesService = {
  /**
   * Lista todos os quizzes disponíveis.
   * Realiza uma requisição GET para o endpoint /quizzes.
   * 
   * @param token Token de autenticação JWT.
   * @returns Promise com a lista de quizzes.
   */
  async list(token: string) {
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },

  /**
   * Cria um novo quiz.
   * Realiza uma requisição POST para o endpoint /quizzes.
   * 
   * @param token Token de autenticação JWT.
   * @param data Dados do novo quiz (DTO).
   * @returns Promise com os dados do quiz criado.
   */
  async create(token: string, data: CreateQuizDTO) {
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Remove um quiz específico.
   * Realiza uma requisição DELETE para o endpoint /quizzes/{id}.
   * 
   * @param token Token de autenticação JWT.
   * @param quizId ID do quiz a ser removido.
   * @returns Promise com o resultado da operação.
   */
  async delete(token: string, quizId: string) {
    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },

  /**
   * Remove TODOS os quizzes do sistema.
   * Operação administrativa crítica.
   * 
   * @param token Token de autenticação JWT.
   * @returns Promise com o resultado da operação.
   */
  async deleteAll(token: string) {
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },
};
