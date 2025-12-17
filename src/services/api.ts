/**
 * MÓDULO DE API (UTILITIES)
 * 
 * Este arquivo centraliza as configurações e utilitários para comunicação HTTP com o backend.
 * Segue o princípio DRY (Don't Repeat Yourself) ao encapsular a lógica de cabeçalhos e tratamento de respostas.
 * 
 * CONSTANTES:
 * - API_BASE_URL: Ponto de entrada único para as Edge Functions.
 */

import { projectId } from '../utils/supabase/info';

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4d5764ce`;

/**
 * Factory de Cabeçalhos HTTP
 * Padroniza a inclusão do token de autorização (Bearer Token) nas requisições.
 */
export const getHeaders = (token?: string | null) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

/**
 * Tratamento Padronizado de Respostas
 * Implementa uma estratégia robusta de parsing de JSON e tratamento de erros HTTP.
 * Garante que erros do backend sejam propagados como exceções JavaScript.
 */
export const handleResponse = async (response: Response) => {
    const tryParseJson = async () => {
        const clone = response.clone();
        try {
            return await clone.json();
        } catch (e) {
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch {
                return { error: text || response.statusText };
            }
        }
    };

    const data = await tryParseJson();

    if (!response.ok) {
        const message = (data && (data.error || data.message)) || response.statusText || 'An error occurred';
        throw new Error(message);
    }

    return data;
};
