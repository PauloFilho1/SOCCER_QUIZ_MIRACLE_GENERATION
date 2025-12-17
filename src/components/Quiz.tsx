/**
 * COMPONENTE DE QUIZ (GAMEPLAY)
 * 
 * Este componente gerencia a interface de jogo do quiz.
 * Ele é responsável por apresentar as perguntas, gerenciar o temporizador e processar as respostas.
 * 
 * FUNCIONALIDADES:
 * - Temporizador (Countdown Timer)
 * - Feedback Visual Instantâneo (Correto/Incorreto)
 * - Barra de Progresso
 * - Rastreamento de Analytics
 * 
 * ARQUITETURA:
 * - Presentation Component: Recebe estado do hook useQuiz e renderiza a UI.
 * - Event Tracking: Envia métricas de engajamento para o serviço de analytics.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { useQuiz } from '../hooks/useQuiz';
import { analyticsService } from '../services/analyticsService';

interface QuizProps {
  quizId: string;
  onBack: () => void;
}

export function Quiz({ quizId, onBack }: QuizProps) {
  // Estado Local - Temporizador
  const [timeLeft, setTimeLeft] = useState<number>(30);

  const handleFinish = () => {
    // Callback executado ao finalizar o quiz.
    // A pontuação é persistida pelo hook useQuiz antes de chamar onBack.
    onBack();
  };

  // Hook Customizado - Lógica do Quiz (State Management)
  const { state, handleAnswerSelect } = useQuiz(quizId, handleFinish);

  // Efeito de Temporizador (Timer Logic)
  // Reinicia a cada nova pergunta e para ao mostrar o resultado.
  useEffect(() => {
    if (!state.currentQuestion || state.showResult) return;
    
    setTimeLeft(state.timeLimit);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submissão quando o tempo esgota (Time-out Handling)
          if (!state.selectedAnswer) {
            handleAnswerSelect('');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.currentQuestion, state.showResult, state.timeLimit]);

  // Rastreamento de Início de Quiz
  useEffect(() => {
    analyticsService.trackEvent('quiz_viewed');
  }, []);

  // Rastreamento de Conclusão
  useEffect(() => {
    if (state.finished) {
      analyticsService.trackEvent('quiz_completed', { score: state.score });
    }
  }, [state.finished, state.score]);

  /**
   * Handler de Resposta
   * Processa a seleção do usuário e envia métricas.
   */
  const handleAnswerAndTrack = (answer: string) => {
    handleAnswerSelect(answer);
    analyticsService.trackEvent('question_answered', {
      questionId: state.currentQuestion?.id,
      answer
    });
  };

  // Renderização de Estados de Carregamento e Erro
  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#E8F5E6] flex items-center justify-center">
        <div className="text-gray-700 text-xl">Carregando quiz...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-[#E8F5E6] p-4">
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-gray-900 mb-4">Erro</h2>
            <p className="text-gray-600 mb-6">{state.error}</p>
            <button
              onClick={onBack}
              className="bg-[#5DA952] hover:bg-[#4F9844] text-white px-6 py-3 rounded-xl transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.finished) {
    return (
      <div className="min-h-screen bg-[#E8F5E6] flex items-center justify-center">
        <div className="text-gray-700 text-xl">Finalizando quiz...</div>
      </div>
    );
  }

  if (!state.currentQuestion) {
    return null;
  }

  const progress = (state.currentQuestionNumber / state.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-[#E8F5E6] p-4">
      {/* Header com botão Voltar */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-[#F4D583] hover:bg-[#F0CA6B] text-gray-800 px-6 py-3 rounded-xl transition-colors shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>

      {/* Card da Pergunta */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* Cabeçalho da pergunta (Meta-info) */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500">
              Pergunta {state.currentQuestionNumber} de {state.totalQuestions}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-500'}`} />
                <span className={`font-semibold ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                  {timeLeft}s
                </span>
              </div>
              <span className="text-gray-500">Pontos: {state.score}</span>
            </div>
          </div>
          
          {/* Barra de progresso Geral */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-[#5DA952] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Barra de tempo (Countdown Bar) */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${(timeLeft / state.timeLimit) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Enunciado da Pergunta */}
        <h2 className="text-gray-900 mb-8">{state.currentQuestion.question}</h2>

        {/* Opções de resposta */}
        <div className="space-y-4">
          {state.currentQuestion.options.map((option, index) => {
            let buttonClass = 'w-full p-4 text-left rounded-xl border-2 transition-all ';

            // Lógica de Estilização Condicional (Feedback Visual)
            if (state.showResult) {
              if (option === state.correctAnswer) {
                buttonClass += 'border-green-500 bg-green-50';
              } else if (option === state.selectedAnswer && !state.isCorrect) {
                buttonClass += 'border-red-500 bg-red-50';
              } else {
                buttonClass += 'border-gray-200 bg-gray-50';
              }
              buttonClass += ' cursor-not-allowed';
            } else if (state.selectedAnswer === option) {
              buttonClass += 'border-blue-400 bg-blue-50';
            } else {
              buttonClass += 'border-gray-200 hover:border-green-300 hover:bg-green-50/30 cursor-pointer';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerAndTrack(option)}
                disabled={state.selectedAnswer !== null}
                className={buttonClass}
              >
                <span className="text-gray-800">{option}</span>
                {state.showResult && option === state.correctAnswer && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Pós-Resposta */}
        {state.showResult && (
          <div className={`mt-6 p-4 rounded-xl ${state.isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <p className={`text-center ${state.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {state.isCorrect ? '✓ Correto! +100 pontos' : `✗ Incorreto. A resposta correta é: ${state.correctAnswer}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
