/**
 * MÓDULO DE AUTENTICAÇÃO (AUTH MODULE)
 * 
 * Este módulo gerencia a identidade e o controle de acesso dos usuários.
 * Ele atua como um Adapter (Padrão de Projeto) para o serviço de autenticação do Supabase,
 * encapsulando a complexidade da integração e fornecendo uma interface simplificada para o domínio.
 * 
 * RESPONSABILIDADES (SRP):
 * - Gerenciamento de usuários (Sign Up, Delete)
 * - Verificação de autenticação (Get Authenticated User)
 * - Controle de Acesso Baseado em Papel (RBAC - Role Based Access Control)
 * - Gerenciamento de Perfil de Usuário
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import type { User, UserProfile } from "./types.tsx";

export class AuthModule {
  private supabase;

  constructor() {
    // Inicialização do cliente Supabase (Dependency Injection via variáveis de ambiente)
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );
  }

  /**
   * Cadastro de Usuário (REQ 09)
   * Cria a identidade no provedor de auth e o perfil no banco de dados local.
   */
  async signUp(
    email: string,
    password: string,
    name: string,
    role: 'player' | 'admin' = 'player'
  ): Promise<User> {
    if (!email || !password || !name) {
      throw new Error('Email, password and name are required');
    }

    // Criação no provedor de identidade (Supabase Auth)
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Confirmação automática de email (simplificação para ambiente de desenvolvimento/MVP)
      email_confirm: true
    });

    if (error) {
      throw new Error(error.message);
    }

    // Persistência do Papel (Role) para RBAC
    await kv.set(`user_role:${data.user.id}`, role);
    
    // Criação do Perfil de Usuário (Entidade de Domínio)
    const userProfile: UserProfile = {
      id: data.user.id,
      email,
      name,
      role,
      totalScore: 0,
      gamesPlayed: 0
    };
    await kv.set(`user_profile:${data.user.id}`, JSON.stringify(userProfile));

    return {
      id: data.user.id,
      email,
      name,
      role
    };
  }

  /**
   * Autenticação e Recuperação de Contexto
   * Valida o token JWT e recupera os dados do perfil associado.
   */
  async getAuthenticatedUser(authHeader: string | null): Promise<User | null> {
    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    // Validação do token via Supabase Auth
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Enriquecimento do contexto com dados do perfil (Data Enrichment)
    const profileStr = await kv.get(`user_profile:${user.id}`);
    if (!profileStr) {
      return null;
    }

    const profile: UserProfile = JSON.parse(profileStr);

    return {
      id: user.id,
      email: user.email || '',
      name: profile.name,
      role: profile.role as 'player' | 'admin'
    };
  }

  /**
   * Verificação de Permissão (RBAC)
   * Verifica se o usuário possui o papel de administrador.
   */
  async isAdmin(userId: string): Promise<boolean> {
    const role = await kv.get(`user_role:${userId}`);
    return role === 'admin';
  }

  /**
   * Recuperação de Perfil
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profileStr = await kv.get(`user_profile:${userId}`);
    if (!profileStr) {
      return null;
    }
    return JSON.parse(profileStr);
  }

  /**
   * Atualização de Perfil (REQ 01)
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const profileStr = await kv.get(`user_profile:${userId}`);
    if (!profileStr) {
      throw new Error('Profile not found');
    }

    const profile: UserProfile = JSON.parse(profileStr);
    const updatedProfile = { ...profile, ...updates };
    await kv.set(`user_profile:${userId}`, JSON.stringify(updatedProfile));
  }

  /**
   * Exclusão de Usuário (REQ 01)
   * Garante a remoção tanto no provedor de identidade quanto no banco de dados local.
   */
  async deleteUser(userId: string): Promise<void> {
    // Remove do provedor gerenciado
    await this.supabase.auth.admin.deleteUser(userId);
    // Limpa dados locais (Consistência Eventual)
    await kv.del(`user_profile:${userId}`);
    await kv.del(`user_role:${userId}`);
  }

  /**
   * Listagem de Perfis
   * Utilizado para funcionalidades administrativas e notificações.
   */
  async listAllProfiles(): Promise<UserProfile[]> {
    const profilesRaw = await kv.getByPrefix('user_profile:');
    return profilesRaw.map((p) => p as UserProfile);
  }
}
