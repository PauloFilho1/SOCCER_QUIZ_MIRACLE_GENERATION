/**
 * TELA INICIAL (HOME DASHBOARD)
 * 
 * Este componente representa o painel principal da aplicação para usuários autenticados.
 * Ele serve como ponto central de navegação e acesso às funcionalidades do sistema.
 * 
 * FUNCIONALIDADES:
 * - Seleção e Início de Quizzes
 * - Visualização de Ranking
 * - Gerenciamento de Perfil de Usuário
 * - Sistema de Convites (EmailJS)
 * - Central de Notificações
 * - Acesso Administrativo (Role-Based Access Control)
 * 
 * ARQUITETURA:
 * - Container Component: Gerencia estado e lógica de dados.
 * - Service Integration: Comunica-se com múltiplos serviços (Quizzes, Notifications, Invites).
 * - Conditional Rendering: Adapta a interface baseada no papel do usuário (Admin/User).
 */

import React, { useEffect, useState } from 'react';
import { Play, Trophy, Plus, LogOut, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { quizzesService, QuizSummary } from '../services/quizzesService';
import { notificationsService } from '../services/notificationsService';
import { invitesService } from '../services/invitesService';
import emailjs from '@emailjs/browser';

// Inicialização do serviço de emails (External Service Adapter)
emailjs.init('3zNcnv-oQk4PUhkQN'); // Public Key

interface HomeProps {
  onStartQuiz: (quizId: string) => void;
  onRanking: () => void;
  onAdmin: () => void;
}

export function Home({ onStartQuiz, onRanking, onAdmin }: HomeProps) {
  // Contexto de Autenticação
  const { user, signOut, accessToken, updateProfile, deleteProfile } = useAuth();

  // Estado Local - Quizzes
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState('');

  // Estado Local - Perfil
  const [nameDraft, setNameDraft] = useState(user?.name || '');

  // Estado Local - Notificações e Convites
  const [notifications, setNotifications] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Sincronização do estado local com o contexto de usuário
  useEffect(() => {
    setNameDraft(user?.name || '');
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  // Carregamento inicial de dados (Data Fetching)
  useEffect(() => {
    const loadQuizzes = async () => {
      if (!accessToken) return;
      setLoadingQuizzes(true);
      setQuizError('');
      try {
        const data = await quizzesService.list(accessToken);
        const list = data.quizzes || [];
        setQuizzes(list);
        // Seleciona automaticamente o primeiro quiz se disponível
        if (list.length && !selectedQuizId) {
          setSelectedQuizId(list[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar quizzes', err);
        setQuizError('Não foi possível carregar os quizzes.');
      } finally {
        setLoadingQuizzes(false);
      }
    };

    const loadNotifications = async () => {
      if (!accessToken) return;
      try {
        const data = await notificationsService.list(accessToken);
        setNotifications(data.notifications || []);
      } catch (err: any) {
        console.error('Erro ao carregar notificações', err);
        // Fallback gracioso em caso de erro (Graceful Degradation)
        setNotifications([]);
      }
    };

    loadQuizzes();
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-[#5DA952] relative overflow-hidden">
      {/* Elementos Decorativos de Fundo (UI/UX) */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/3 left-0 right-0 h-[2px] bg-white"></div>
        <div className="absolute bottom-1/3 left-0 right-0 h-[2px] bg-white"></div>
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1000 200">
          <path
            d="M 0 150 Q 250 100 500 150 T 1000 150 L 1000 200 L 0 200 Z"
            fill="rgba(0,0,0,0.1)"
          />
        </svg>
      </div>

      {/* Cabeçalho Principal */}
      <header className="bg-[#4F9844] p-4 flex items-center justify-between relative z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#5DA952" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2 L12 22 M2 12 L22 12" />
              <circle cx="12" cy="12" r="3" fill="#5DA952" />
            </svg>
          </div>
          <div>
            <h1 className="text-white">Quiz de Futebol</h1>
            <p className="text-white/80 text-sm">👤 {user?.name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Sair"
        >
          <LogOut className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 pb-8 max-w-2xl mx-auto relative z-10 mt-8">
        <div className="space-y-6">
          
          {/* Card: Jogar Quiz */}
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-gray-900">Jogar Quiz</h2>
                <p className="text-gray-500">Teste seus conhecimentos sobre futebol</p>
              </div>
            </div>

            {quizError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{quizError}</div>
            )}

            {loadingQuizzes ? (
              <div className="text-gray-500">Carregando quizzes...</div>
            ) : quizzes.length === 0 ? (
              <div className="text-gray-600">Nenhum quiz disponível no momento.</div>
            ) : (
              <>
                <label className="block text-gray-700">Selecione um quiz</label>
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.name}
                      {quiz.description ? ` — ${quiz.description}` : ''}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button
              onClick={() => selectedQuizId && onStartQuiz(selectedQuizId)}
              disabled={!selectedQuizId}
              className="w-full bg-[#5DA952] hover:bg-[#4F9844] text-white py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              Começar Agora
            </button>
          </div>

          {/* Card: Ranking */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-gray-900">Ranking</h2>
                <p className="text-gray-500">Veja os melhores jogadores</p>
              </div>
            </div>
            <button
              onClick={onRanking}
              className="w-full bg-green-100 hover:bg-green-200 text-gray-800 py-3 rounded-xl transition-colors"
            >
              Ver Ranking
            </button>
          </div>

          {/* Card: Gerenciamento de Conta */}
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-gray-900">Sua conta</h2>
                <p className="text-gray-500">Atualize o nome ou exclua a conta.</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm text-gray-600">Nome</label>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                onClick={async () => {
                  if (!nameDraft) return;
                  await updateProfile({ name: nameDraft });
                }}
                className="w-full bg-blue-100 hover:bg-blue-200 text-gray-800 py-2 rounded-lg"
              >
                Salvar
              </button>
              <button
                onClick={async () => {
                  if (confirm('Deseja realmente excluir sua conta?')) {
                    await deleteProfile();
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginTop: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Excluir conta
              </button>
            </div>
          </div>

          {/* Card: Painel Admin (Renderização Condicional) */}
          {user?.role === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-gray-900">Painel Admin</h2>
                  <p className="text-gray-500">Gerenciar perguntas do quiz</p>
                </div>
              </div>
              <button
                onClick={onAdmin}
                className="w-full bg-purple-100 hover:bg-purple-200 text-gray-800 py-3 rounded-xl transition-colors"
              >
                Acessar Painel
              </button>
            </div>
          )}

          {/* Card: Convites (Apenas para usuários comuns) */}
          {user?.role !== 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
              <h2 className="text-gray-900">Convidar Amigos</h2>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Email para convite"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={async () => {
                    setInviteMessage('');
                    try {
                      if (!inviteEmail) throw new Error('Informe o email');
                      
                      // Envio de email via serviço externo (EmailJS)
                      await emailjs.send(
                        'service_59j3dib', // Service ID
                        'template_if21bw9', // Template ID
                        {
                          to_email: inviteEmail,
                          from_name: user?.name || 'Quiz de Futebol',
                          to_name: inviteEmail.split('@')[0],
                          app_url: 'https://soccer-quiz-miracle-generation.vercel.app'
                        }
                      );
                      
                      // Persistência do convite no banco de dados
                      await invitesService.create(accessToken!, { email: inviteEmail });
                      
                      setInviteEmail('');
                      setInviteMessage('✅ Convite enviado com sucesso!');
                    } catch (err: any) {
                      console.error('Erro ao enviar convite:', err);
                      setInviteMessage(err.message || 'Erro ao enviar convite');
                    }
                  }}
                  className="w-full bg-[#5DA952] hover:bg-[#4F9844] text-white px-4 py-2 rounded-lg"
                >
                  Enviar convite
                </button>
                {inviteMessage && (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{inviteMessage}</div>
                )}
              </div>
            </div>
          )}

          {/* Card: Notificações */}
          {notifications.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Play className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-gray-900">Notificações</h2>
                  <p className="text-gray-500">Novos quizzes e avisos</p>
                </div>
              </div>
              <ul className="space-y-2">
                {notifications.slice(0, 5).map((n) => (
                  <li key={n.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-800 font-semibold">{n.title}</div>
                    <div className="text-sm text-gray-600">{n.message}</div>
                    <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
