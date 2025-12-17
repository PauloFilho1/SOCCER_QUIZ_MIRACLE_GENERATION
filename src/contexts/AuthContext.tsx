/**
 * CONTEXTO DE AUTENTICAÇÃO (AUTH CONTEXT)
 * 
 * Este módulo implementa o padrão Provider do React para gerenciar o estado global de autenticação.
 * Ele atua como uma fonte única de verdade (Single Source of Truth) para os dados do usuário e token.
 * 
 * PADRÕES E PRINCÍPIOS:
 * - Dependency Injection: O AuthProvider injeta o estado de autenticação em toda a árvore de componentes.
 * - Observer Pattern: Utiliza 'onAuthStateChange' para reagir a mudanças no estado de autenticação do Supabase.
 * - Facade Pattern: Simplifica a interação com o 'authService', expondo apenas métodos essenciais.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// Definição de Tipos (Interface Segregation)
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  totalScore: number;
  gamesPlayed: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { name?: string }) => Promise<void>;
  deleteProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Gerenciamento de Estado Local
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  /**
   * Busca o perfil do usuário no backend
   * Separação de responsabilidade: O Contexto gerencia o estado, o Service busca os dados.
   */
  const fetchUserProfile = async (token: string) => {
    try {
      const data = await authService.getUserProfile(token);
      setUser(data.profile);
      
      // Aguarda um ciclo de renderização para garantir propagação do estado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setIsAuthReady(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsAuthReady(false);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (accessToken) {
      await fetchUserProfile(accessToken);
    }
  };

  /**
   * Efeito de Inicialização e Monitoramento
   * Configura os listeners de autenticação ao montar o componente.
   */
  useEffect(() => {
    // Verifica sessão existente ao carregar
    authService.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setAccessToken(session.access_token);
        fetchUserProfile(session.access_token);
      } else {
        setIsAuthReady(true);
        setLoading(false);
      }
    });

    // Observer: Escuta mudanças de estado (login, logout, refresh token)
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setAccessToken(session.access_token);
        fetchUserProfile(session.access_token);
      } else {
        setAccessToken(null);
        setUser(null);
        setIsAuthReady(true);
        setLoading(false);
      }
    });

    // Cleanup: Remove o listener ao desmontar
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Autenticação (Login)
   * Inclui lógica de sincronização de estado para garantir consistência na primeira carga.
   */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setIsAuthReady(false);
    try {
      const data = await authService.signIn(email, password);

      if (data.session?.access_token) {
        // Força reload silencioso ANTES de processar o perfil no primeiro login
        const isFirstLogin = !sessionStorage.getItem('hasLoggedBefore');
        if (isFirstLogin) {
          sessionStorage.setItem('hasLoggedBefore', 'true');
          setAccessToken(data.session.access_token);
          // Aguarda um momento para garantir que o token foi salvo no Supabase
          await new Promise(resolve => setTimeout(resolve, 100));
          window.location.reload();
          return;
        }
        
        setAccessToken(data.session.access_token);
        await fetchUserProfile(data.session.access_token);
      } else {
        setIsAuthReady(true);
        setLoading(false);
      }
    } catch (error) {
      setIsAuthReady(true);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Registro de Usuário
   * Encadeia o registro com o login automático.
   */
  const signUp = async (email: string, password: string, name: string, role?: string) => {
    setLoading(true);
    setIsAuthReady(false);
    try {
      await authService.signUp(email, password, name, role);
      await signIn(email, password);
    } catch (error) {
      setIsAuthReady(true);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setAccessToken(null);
    setUser(null);
    // Limpa a flag ao fazer logout
    sessionStorage.removeItem('hasLoggedBefore');
  };

  const updatePassword = async (password: string) => {
    await authService.updatePassword(password);
  };

  const updateProfile = async (updates: { name?: string }) => {
    if (!accessToken) return;
    const data = await authService.updateProfile(accessToken, updates);
    setUser(data.profile);
  };

  const deleteProfile = async () => {
    if (!accessToken) return;
    await authService.deleteProfile(accessToken);
    await signOut();
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut, refreshProfile, updateProfile, deleteProfile, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook Customizado (Encapsulamento)
 * Garante que o contexto seja acessado apenas dentro do Provider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
