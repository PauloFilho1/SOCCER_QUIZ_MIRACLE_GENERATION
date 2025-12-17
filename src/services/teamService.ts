/**
 * SERVIÇO DE TIMES (TEAM SERVICE)
 * 
 * Este módulo gerencia as operações relacionadas aos times (equipes) do sistema.
 * Ele fornece uma interface abstrata para o frontend interagir com a API de times.
 * 
 * PADRÕES UTILIZADOS:
 * - Service Object: Centralização da lógica de acesso a dados de times.
 * - DTO (Data Transfer Object): Padronização dos objetos de transferência.
 * - CRUD Interface: Implementação das operações padrão de Create, Read, Update, Delete.
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';

/**
 * DTO que representa um Time no sistema.
 * Utilizado tanto para criação quanto para listagem.
 */
export interface TeamDTO {
  id?: string;
  name: string;
  description?: string;
}

export const teamService = {
  /**
   * Recupera a lista de todos os times cadastrados.
   * 
   * @param token Token de autenticação JWT.
   * @returns Promise com a lista de times.
   */
  async list(token: string) {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },

  /**
   * Cria um novo time no sistema.
   * 
   * @param token Token de autenticação JWT.
   * @param data Dados do time a ser criado.
   * @returns Promise com os dados do time criado.
   */
  async create(token: string, data: TeamDTO) {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Atualiza os dados de um time existente.
   * Suporta atualização parcial (PATCH/PUT).
   * 
   * @param token Token de autenticação JWT.
   * @param id Identificador único do time.
   * @param data Dados a serem atualizados (Partial<TeamDTO>).
   * @returns Promise com o resultado da atualização.
   */
  async update(token: string, id: string, data: Partial<TeamDTO>) {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Remove um time do sistema.
   * 
   * @param token Token de autenticação JWT.
   * @param id Identificador único do time a ser removido.
   * @returns Promise com o resultado da remoção.
   */
  async remove(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return handleResponse(response);
  },
};
