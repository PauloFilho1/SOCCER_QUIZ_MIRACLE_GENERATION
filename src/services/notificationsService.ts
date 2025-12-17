/**
 * SERVIÇO DE NOTIFICAÇÕES
 * 
 * Responsável por buscar as notificações do usuário.
 * 
 * PADRÕES:
 * - Service Object: Centraliza o acesso a dados de notificações.
 * - Graceful Degradation: Trata erro 404 (endpoint inexistente) retornando lista vazia
 *   para não quebrar a aplicação caso o backend ainda não tenha implementado a rota.
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';

export const notificationsService = {
  /**
   * Lista as notificações do usuário autenticado.
   * 
   * @param token Token de autenticação
   */
  async list(token: string) {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getHeaders(token),
    });
    // Se a função ainda não estiver publicada, evita quebrar o app.
    if (response.status === 404) {
      return { notifications: [] };
    }
    return handleResponse(response);
  },
};
