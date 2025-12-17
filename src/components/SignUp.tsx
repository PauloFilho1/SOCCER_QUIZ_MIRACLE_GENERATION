/**
 * TELA DE CADASTRO (SIGN UP)
 * 
 * Componente responsável pelo registro de novos usuários.
 * 
 * FUNCIONALIDADES:
 * - Coleta de dados cadastrais (Nome, Email, Senha).
 * - Seleção de Perfil (Jogador ou Admin) - *Nota: Em produção, a criação de admins seria restrita*.
 * - Validação de formulário no cliente (senhas iguais, tamanho mínimo).
 * 
 * ARQUITETURA:
 * - Context API Integration: Utiliza 'signUp' do AuthContext.
 * - Form Handling: Gerenciamento de estado controlado para inputs.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SignUpProps {
  onNavigateToLogin: () => void;
}

export function SignUp({ onNavigateToLogin }: SignUpProps) {
  // Estado do Formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'player' | 'admin'>('player');
  
  // Estado de UI
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dependência de Autenticação
  const { signUp } = useAuth();

  /**
   * Processa o registro do novo usuário.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações Client-Side
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Chama o serviço de autenticação
      await signUp(email, password, name, role);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6CB860] via-[#5DA952] to-[#4F9844] relative overflow-hidden flex items-center justify-center p-4">
      {/* Campo de futebol decorativo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/30 rounded-full"></div>
        <div className="absolute top-0 left-0 w-40 h-40 border-2 border-white/20 rounded-br-full"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 border-2 border-white/20 rounded-tl-full"></div>
      </div>

      {/* Card de Cadastro */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-gray-900 mb-2">Cadastrar</h1>
          <p className="text-gray-500">Crie sua conta para jogar</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-800 mb-2">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-3 bg-green-50/50 border border-green-200/50 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
              required
              disabled={loading}
            />
          </div>

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

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-800 mb-2">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-green-50/50 border border-green-200/50 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-800 mb-2">Tipo de Conta</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="player"
                  checked={role === 'player'}
                  onChange={(e) => setRole(e.target.value as 'player' | 'admin')}
                  className="w-4 h-4 text-green-600"
                  disabled={loading}
                />
                <span className="text-gray-700">Jogador</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value as 'player' | 'admin')}
                  className="w-4 h-4 text-green-600"
                  disabled={loading}
                />
                <span className="text-gray-700">Administrador</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5DA952] hover:bg-[#4F9844] text-white py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem conta?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
