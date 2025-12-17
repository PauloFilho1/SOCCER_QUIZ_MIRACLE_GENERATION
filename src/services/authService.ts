/**
 * SERVIÇO DE AUTENTICAÇÃO (AUTH SERVICE)
 * 
 * Este serviço atua como uma Facade (Fachada) para as operações de autenticação.
 * Ele abstrai a complexidade de lidar com o SDK do Supabase e as chamadas REST para o backend.
 * 
 * ARQUITETURA:
 * - Hybrid Approach: Utiliza o SDK do Supabase para autenticação (OAuth/JWT) e 
 *   chamadas HTTP diretas para operações de perfil (Backend for Frontend).
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';
import { publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';

// Singleton do cliente Supabase
const supabase = createClient();

export const authService = {
    /**
     * Login (SDK Supabase)
     */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    },

    /**
     * Cadastro (REST API)
     * Delega a criação do usuário para o backend customizado para garantir a criação do perfil.
     */
    async signUp(email: string, password: string, name: string, role?: string) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, role }),
        });

        return handleResponse(response);
    },

    async signOut() {
        await supabase.auth.signOut();
    },

    /**
     * Atualização de Perfil (REST API)
     */
    async updateProfile(token: string, updates: { name?: string }) {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(updates)
        });
        if (response.status === 404) {
            throw new Error('Rota de perfil não encontrada. Refaça o deploy da função make-server-4d5764ce.');
        }
        return handleResponse(response);
    },

    /**
     * Exclusão de Perfil (REST API)
     */
    async deleteProfile(token: string) {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'DELETE',
            headers: getHeaders(token)
        });
        if (response.status === 404) {
            throw new Error('Rota de perfil não encontrada. Refaça o deploy da função make-server-4d5764ce.');
        }
        return handleResponse(response);
    },

    /**
     * Recuperação de Perfil (REST API)
     */
    async getUserProfile(token: string) {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: getHeaders(token),
        });

        return handleResponse(response);
    },

    /**
     * Reset de Senha (SDK Supabase)
     * Configura a URL de redirecionamento dinamicamente.
     */
    async resetPassword(email: string) {
        const siteUrl = (import.meta as any)?.env?.VITE_SITE_URL
            || (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL
            || window.location.origin;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/reset-password`
        });
        if (error) throw new Error(error.message);
        return { success: true };
    },

    /**
     * Observer de Estado
     */
    onAuthStateChange(callback: (event: any, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    async getSession() {
        return supabase.auth.getSession();
    },

    async updatePassword(password: string) {
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message);
        return data;
    }
};
