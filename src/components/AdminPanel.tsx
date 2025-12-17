/**
 * PAINEL ADMINISTRATIVO (ADMIN PANEL)
 * 
 * Este componente é o centro de controle para administradores do sistema.
 * Ele permite o gerenciamento completo do ciclo de vida de quizzes e perguntas.
 * 
 * FUNCIONALIDADES:
 * - Criação de Quizzes e Perguntas
 * - Listagem e Filtragem
 * - Exclusão (Unitária e em Massa)
 * - Gerenciamento de Times (Teams)
 * 
 * ARQUITETURA DE UI:
 * - Layout Responsivo: Grid system adaptável (Mobile/Desktop).
 * - Feedback Visual: Indicadores de carregamento e mensagens de erro/sucesso.
 * - Danger Zone: Seção segregada para operações destrutivas.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAdminQuestions } from '../hooks/useAdminQuestions';
import { quizzesService, QuizSummary } from '../services/quizzesService';
import { useAuth } from '../contexts/AuthContext';
import { teamService, TeamDTO } from '../services/teamService';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  // Contexto de Autenticação (Dependency Injection)
  const { accessToken } = useAuth();

  // Estado Local - Gerenciamento de Quizzes
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState('');
  
  // Estado de Seleção (Filtro)
  // '' = todos os quizzes; id específico para filtrar perguntas
  const [selectedQuizId, setSelectedQuizId] = useState('');
  
  // Estado Local - Gerenciamento de Times
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamError, setTeamError] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);

  // Hook Customizado para Lógica de Perguntas (Separation of Concerns)
  const { questions, loading, createQuestion, deleteQuestion, refreshQuestions } = useAdminQuestions(selectedQuizId);
  
  // Controle de UI
  const [showForm, setShowForm] = useState(false);

  // Estado do Formulário de Perguntas
  const [question, setQuestion] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [option4, setOption4] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [team, setTeam] = useState('general');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado do Formulário de Quiz
  const [quizName, setQuizName] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizTeam, setQuizTeam] = useState('general');
  const [quizTimeLimit, setQuizTimeLimit] = useState(30);
  const [quizFormLoading, setQuizFormLoading] = useState(false);

  /**
   * Handler de Submissão de Pergunta
   * Realiza validações no frontend antes de enviar ao backend.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const options = [option1, option2, option3, option4];

    // Validação de Integridade
    if (!selectedQuizId) {
      setError('Selecione um quiz para adicionar a pergunta.');
      setFormLoading(false);
      return;
    }

    if (!options.includes(correctAnswer)) {
      setError('A resposta correta deve ser uma das opções fornecidas');
      setFormLoading(false);
      return;
    }

    try {
      await createQuestion({
        question,
        options,
        correctAnswer,
        team: 'general',
        quizId: selectedQuizId
      });

      // Reset do formulário após sucesso
      setQuestion('');
      setOption1('');
      setOption2('');
      setOption3('');
      setOption4('');
      setCorrectAnswer('');
      setShowForm(false);
    } catch (error: any) {
      setError(error.message || 'Erro ao criar pergunta');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Carregamento de Dados (Data Fetching)
   * Busca a lista de quizzes disponíveis.
   */
  const loadQuizzes = async () => {
    setLoadingQuizzes(true);
    setQuizError('');
    try {
      if (!accessToken) throw new Error('Token não encontrado');
      const data = await quizzesService.list(accessToken);
      const list = data.quizzes || [];
      setQuizzes(list);
    } catch (err: any) {
      console.error('Erro ao carregar quizzes', err);
      setQuizError(err?.message || 'Erro ao carregar quizzes');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const loadTeams = async () => {
    if (!accessToken) return;
    try {
      const data = await teamService.list(accessToken);
      setTeams(data.teams || []);
    } catch (err) {
      console.error('Erro ao carregar times', err);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
    try {
      await deleteQuestion(questionId);
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  // Efeito de Inicialização
  useEffect(() => {
    if (accessToken) {
      loadQuizzes();
      loadTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  /**
   * Criação de Quiz
   */
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError('');
    setQuizFormLoading(true);
    try {
      if (!accessToken) throw new Error('Token não encontrado');
      const { quiz } = await quizzesService.create(accessToken, {
        name: quizName,
        description: quizDescription,
        team: quizTeam,
        timeLimit: quizTimeLimit,
      });
      await loadQuizzes();
      setSelectedQuizId(quiz.id);
      // Limpeza do formulário
      setQuizName('');
      setQuizDescription('');
      setQuizTeam('general');
      setQuizTimeLimit(30);
    } catch (err: any) {
      console.error('Erro ao criar quiz', err);
      setQuizError(err?.message || 'Erro ao criar quiz');
    } finally {
      setQuizFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F5E6] p-4 pb-8">
      {/* Header de Navegação */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-gray-200/50 text-gray-700 px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#5DA952] hover:bg-[#4F9844] text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Fechar formulário' : 'Adicionar quiz/pergunta'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Coluna 1: Gerenciamento de Quizzes */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 mb-8 lg:mb-0">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-gray-900 text-xl font-semibold">Quizzes</h2>
            </div>

          {quizError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{quizError}</div>
          )}

          {/* Formulário de Criação de Quiz */}
          <form onSubmit={handleCreateQuiz} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-1">Nome do Quiz</label>
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Time/Categoria padrão</label>
              <input
                type="text"
                value={quizTeam}
                onChange={(e) => setQuizTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Tempo por pergunta (segundos)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={quizTimeLimit}
                onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button
                type="submit"
                disabled={quizFormLoading}
                className="bg-[#5DA952] hover:bg-[#4F9844] text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {quizFormLoading ? 'Criando...' : 'Criar Quiz'}
              </button>
            </div>
          </form>

          {/* Seletor de Quiz Ativo */}
          <div>
            <label className="block text-gray-700 mb-2">Quiz selecionado</label>
            {loadingQuizzes ? (
              <div className="text-gray-500">Carregando quizzes...</div>
            ) : quizzes.length === 0 ? (
              <div className="text-gray-500">Nenhum quiz cadastrado ainda.</div>
            ) : (
              <select
                value={selectedQuizId}
                onChange={async (e) => {
                  const id = e.target.value;
                  setSelectedQuizId(id);
                  await refreshQuestions(id || undefined);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todos os quizzes</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

          {/* Coluna 2: Criação de Perguntas */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4 mb-8 lg:mb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900 text-xl font-semibold">Criar Nova Pergunta</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg"
            >
              {showForm ? 'Esconder formulário' : 'Mostrar formulário'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!selectedQuizId && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
              Cadastre e selecione um quiz para adicionar perguntas.
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Pergunta</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Digite a pergunta"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Opção 1</label>
                  <input
                    type="text"
                    value={option1}
                    onChange={(e) => setOption1(e.target.value)}
                    placeholder="Primeira opção"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Opção 2</label>
                  <input
                    type="text"
                    value={option2}
                    onChange={(e) => setOption2(e.target.value)}
                    placeholder="Segunda opção"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Opção 3</label>
                  <input
                    type="text"
                    value={option3}
                    onChange={(e) => setOption3(e.target.value)}
                    placeholder="Terceira opção"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Opção 4</label>
                  <input
                    type="text"
                    value={option4}
                    onChange={(e) => setOption4(e.target.value)}
                    placeholder="Quarta opção"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Resposta Correta</label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Digite a resposta correta (exatamente como uma das opções)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={formLoading}
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-[#5DA952] hover:bg-[#4F9844] text-white py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Criando...' : 'Criar Pergunta'}
              </button>
            </form>
          )}
          </div>
        </div>

        {/* Seção de Gerenciamento Avançado (Danger Zone) */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '32px', marginBottom: '32px' }}>
          <h2 className="text-gray-900 text-xl font-semibold mb-6">Gerenciar Quizzes</h2>
          
          <div className="space-y-4">
            {/* Deletar Quiz Específico */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-gray-800 font-medium mb-3">Deletar Quiz Específico</h3>
              <div className="flex gap-3">
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Selecione um quiz</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.name} ({quiz.questionIds?.length || 0} perguntas)
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!selectedQuizId) {
                      alert('Selecione um quiz para deletar');
                      return;
                    }
                    if (confirm('Tem certeza que deseja deletar este quiz? Isso também removerá todas as perguntas e sessões relacionadas.')) {
                      try {
                        await quizzesService.delete(accessToken!, selectedQuizId);
                        alert('Quiz deletado com sucesso!');
                        setSelectedQuizId('');
                        loadQuizzes();
                        refreshQuestions();
                      } catch (err: any) {
                        alert(err.message || 'Erro ao deletar quiz');
                      }
                    }
                  }}
                  disabled={!selectedQuizId}
                  style={{
                    backgroundColor: selectedQuizId ? '#dc2626' : '#e5e7eb',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: selectedQuizId ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                  Deletar Quiz
                </button>
              </div>
            </div>

            {/* Deletar Todos os Quizzes (Ação Crítica) */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="text-red-800 font-medium mb-2">⚠️ Zona de Perigo</h3>
              <p className="text-sm text-red-700 mb-3">
                Esta ação irá deletar TODOS os quizzes, perguntas, sessões e resetar o ranking. Esta ação NÃO pode ser desfeita!
              </p>
              <button
                onClick={async () => {
                  const confirmation = prompt(
                    'Esta ação é IRREVERSÍVEL! Digite "DELETAR TUDO" para confirmar:'
                  );
                  if (confirmation === 'DELETAR TUDO') {
                    try {
                      await quizzesService.deleteAll(accessToken!);
                      alert('Todos os quizzes foram deletados e o ranking foi resetado!');
                      setSelectedQuizId('');
                      loadQuizzes();
                      refreshQuestions();
                    } catch (err: any) {
                      alert(err.message || 'Erro ao deletar quizzes');
                    }
                  } else if (confirmation !== null) {
                    alert('Confirmação incorreta. Operação cancelada.');
                  }
                }}
                style={{
                  backgroundColor: '#991b1b',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7f1d1d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#991b1b'}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Deletar TODOS os Quizzes
              </button>
            </div>
          </div>
        </div>

        {/* Listagem de Perguntas */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-gray-900 text-xl font-semibold mb-6">Perguntas Cadastradas ({questions.length})</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma pergunta cadastrada ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-2">{q.question}</h3>
                      <div className="space-y-1 mb-2">
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`text-sm px-3 py-1 rounded ${opt === q.correctAnswer
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-50 text-gray-700'
                              }`}
                          >
                            {opt} {opt === q.correctAnswer && '✓'}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {q.team}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
