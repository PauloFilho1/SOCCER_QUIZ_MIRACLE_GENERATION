/**
 * TELA DE LOGIN
 * 
 * Componente responsável pela autenticação de usuários existentes.
 * 
 * ARQUITETURA:
 * - Context API Integration: Consome 'useAuth' para realizar operações de login (signIn)
 *   e recuperação de senha (resetPassword).
 * - State Management: Gerencia estados locais de formulário, carregamento e erros.
 * - Feedback UI: Fornece feedback visual imediato para ações do usuário (sucesso/erro).
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onNavigateToSignUp: () => void;
}

export function Login({ onNavigateToSignUp }: LoginProps) {
  // Gerenciamento de Estado Local
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para fluxo de recuperação de senha
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  // Injeção de Dependência (AuthContext)
  const { signIn, resetPassword } = useAuth();

  /**
   * Manipula o envio do formulário de login.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inicia o fluxo de recuperação de senha via email.
   */
  const handleResetPassword = async () => {
    setError('');
    setResetMessage('');
    if (!email) {
      setError('Informe seu email para receber o link de recuperação.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(email);
      setResetMessage('Enviamos um link de recuperação para seu email.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar recuperação');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6CB860] via-[#5DA952] to-[#4F9844] relative overflow-hidden flex items-center justify-center p-4">
      {/* Campo de futebol decorativo - linhas */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/30 rounded-full"></div>
        <div className="absolute top-0 left-0 w-40 h-40 border-2 border-white/20 rounded-br-full"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 border-2 border-white/20 rounded-tl-full"></div>
      </div>

      {/* Gol ilustrativo na parte inferior */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-32 opacity-30">
        <svg viewBox="0 0 300 150" className="w-full h-full">
          <path
            d="M 50 150 L 50 50 L 250 50 L 250 150"
            fill="none"
            stroke="white"
            strokeWidth="3"
          />
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={50 + i * 10}
              y1={50}
              x2={50 + i * 10}
              y2={150}
              stroke="white"
              strokeWidth="0.5"
              opacity="0.6"
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={50}
              y1={50 + i * 10}
              x2={250}
              y2={50 + i * 10}
              stroke="white"
              strokeWidth="0.5"
              opacity="0.6"
            />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`d-${i}`}
              x1={50 + i * 10}
              y1={50}
              x2={50}
              y2={50 + i * 5}
              stroke="white"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
        </svg>
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-gray-900 mb-2">Entrar</h1>
          <p className="text-gray-500">Entre para jogar o Quiz de Futebol</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {resetMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-800 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-green-50/50 border border-green-200/50 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-800 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-green-50/50 border border-green-200/50 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5DA952] hover:bg-[#4F9844] text-white py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          <div className="text-sm text-gray-600">Esqueceu a senha?</div>
          <button
            type="button"
            onClick={handleResetPassword}
            className="w-full bg-gray-900 text-white font-semibold px-4 py-3 rounded-lg border border-gray-800 shadow-md hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5DA952] transition disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: '#111827', color: '#ffffff', borderColor: '#0f172a' }}
            disabled={resetLoading}
          >
            {resetLoading ? 'Enviando...' : 'Enviar link para o email acima'}
          </button>
          <p className="text-xs text-gray-500">Usaremos o email que você digitou no campo acima.</p>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600">
            Não tem conta?{' '}
            <button
              onClick={onNavigateToSignUp}
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}