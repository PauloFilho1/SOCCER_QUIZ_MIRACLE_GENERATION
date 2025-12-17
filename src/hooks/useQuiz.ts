import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { quizService } from '../services/quizService';

interface CurrentQuestion {
    id: string;
    question: string;
    options: string[];
}

interface QuizState {
    sessionId: string | null;
    currentQuestion: CurrentQuestion | null;
    currentQuestionNumber: number;
    totalQuestions: number;
    score: number;
    selectedAnswer: string | null;
    showResult: boolean;
    isCorrect: boolean;
    correctAnswer: string;
    loading: boolean;
    error: string;
    finished: boolean;
    timeLimit: number;
}

export function useQuiz(quizId: string, onFinish: () => void) {
    const { accessToken, refreshProfile } = useAuth();
    const [state, setState] = useState<QuizState>({
        sessionId: null,
        currentQuestion: null,
        currentQuestionNumber: 0,
        totalQuestions: 0,
        score: 0,
        selectedAnswer: null,
        showResult: false,
        isCorrect: false,
        correctAnswer: '',
        loading: true,
        error: '',
        finished: false,
        timeLimit: 30
    });

    useEffect(() => {
        if (quizId) {
            startQuiz();
        }
    }, [quizId]);

    const startQuiz = async () => {
        if (!accessToken || !quizId) return;

        try {
            const startData = await quizService.startQuiz(accessToken, quizId);
            const questionData = await quizService.getCurrentQuestion(accessToken);

            setState(prev => ({
                ...prev,
                sessionId: startData.sessionId,
                currentQuestion: questionData.question,
                currentQuestionNumber: questionData.currentQuestion,
                totalQuestions: questionData.totalQuestions,
                score: questionData.score,
                timeLimit: startData.timeLimit || 30,
                loading: false
            }));
        } catch (error) {
            console.error('Error starting quiz:', error);
            setState(prev => ({ ...prev, error: 'Erro ao iniciar quiz', loading: false }));
        }
    };

    const handleAnswerSelect = async (answer: string) => {
        if (state.selectedAnswer || !accessToken) return;

        setState(prev => ({ ...prev, selectedAnswer: answer }));

        try {
            const data = await quizService.answerQuestion(accessToken, answer);

            setState(prev => ({
                ...prev,
                showResult: true,
                isCorrect: data.correct,
                correctAnswer: data.correctAnswer,
                score: data.totalScore
            }));

            setTimeout(async () => {
                if (data.hasMoreQuestions) {
                    const questionData = await quizService.getCurrentQuestion(accessToken);
                    setState(prev => ({
                        ...prev,
                        currentQuestion: questionData.question,
                        currentQuestionNumber: questionData.currentQuestion,
                        selectedAnswer: null,
                        showResult: false,
                        isCorrect: false,
                        correctAnswer: ''
                    }));
                } else {
                    const finishData = await quizService.finishQuiz(accessToken);
                    await refreshProfile();
                    setState(prev => ({ ...prev, finished: true }));

                    setTimeout(() => {
                        alert(`Quiz finalizado!\n\nPontuação final: ${finishData.finalScore}\nRespostas corretas: ${finishData.correctAnswers} de ${finishData.totalQuestions}`);
                        onFinish();
                    }, 1000);
                }
            }, 1500);
        } catch (error) {
            console.error('Error submitting answer:', error);
            setState(prev => ({ ...prev, error: 'Erro ao enviar resposta' }));
        }
    };

    return {
        state,
        handleAnswerSelect
    };
}
