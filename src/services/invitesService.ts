/**
 * SERVIÇO DE CONVITES
 * 
 * Gerencia o envio e listagem de convites para novos usuários.
 * 
 * PADRÕES:
 * - Service Object: Encapsula a lógica de negócios relacionada a convites.
 * - DTO (Data Transfer Object): Define a estrutura dos dados de convite (InviteDTO).
 * - Adapter: Utiliza 'handleResponse' para padronizar o tratamento de respostas da API.
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface InviteDTO {
  email: string;
}

export const invitesService = {
  /**
   * Envia um novo convite por email.
   * 
   * @param token Token de autenticação do usuário (admin)
   * @param data Dados do convite (email)
   */
  async create(token: string, data: InviteDTO) {
    const response = await fetch(`${API_BASE_URL}/invites`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Lista todos os convites enviados.
   * 
   * @param token Token de autenticação do usuário (admin)
   */
  async list(token: string) {
    const response = await fetch(`${API_BASE_URL}/invites`, {
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },
};
