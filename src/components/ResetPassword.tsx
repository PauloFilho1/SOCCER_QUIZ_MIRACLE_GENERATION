/**
 * TELA DE REDEFINIÇÃO DE SENHA
 * 
 * Componente acessado quando o usuário clica no link de recuperação enviado por email.
 * Permite definir uma nova senha para a conta.
 * 
 * FLUXO:
 * 1. Usuário acessa link com token de recuperação (geralmente via hash na URL).
 * 2. Supabase Auth detecta o evento de recuperação.
 * 3. Este componente é renderizado para coletar a nova senha.
 * 4. Após sucesso, limpa o estado e redireciona para Login.
 * 
 * ARQUITETURA:
 * - Context API: Usa 'updatePassword' para persistir a mudança.
 * - Security Best Practices: Limpa hash da URL e força logout após alteração.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ResetPasswordProps {
  onDone: () => void;
}

export function ResetPassword({ onDone }: ResetPasswordProps) {
  const { updatePassword, signOut } = useAuth();
  
  // Estado Local
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Processa a atualização da senha.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      // Atualiza a senha no backend (Supabase)
      await updatePassword(password);
      setSuccess('Senha atualizada com sucesso. Você já pode entrar.');
      
      // Limpa o hash da URL para evitar reentrar nesse fluxo acidentalmente
      if (typeof window !== 'undefined') {
        window.location.hash = '';
      }
      
      // Sai da sessão de recuperação para forçar login com a nova senha
      await signOut();
      onDone();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6CB860] via-[#5DA952] to-[#4F9844] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-gray-900 mb-1">Definir nova senha</h1>
          <p className="text-gray-500 text-sm">Defina a nova senha para acessar sua conta.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-800 mb-2">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-green-50/50 border border-green-200/50 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-800 mb-2">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-green-50/50 border border-green-200/50 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5DA952] hover:bg-[#4F9844] text-white py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
