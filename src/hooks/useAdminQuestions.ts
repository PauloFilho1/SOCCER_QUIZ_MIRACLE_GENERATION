import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { questionService, CreateQuestionDTO } from '../services/questionService';

interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    team: string;
    createdAt: string;
}

export function useAdminQuestions(activeQuizId?: string) {
    const { accessToken } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (accessToken) {
            fetchQuestions(activeQuizId);
        }
    }, [accessToken, activeQuizId]);

    const fetchQuestions = async (quizId?: string) => {
        if (!accessToken) return;
        try {
            const data = await questionService.getQuestions(accessToken, quizId);
            setQuestions(data.questions);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setError('Erro ao carregar perguntas');
        } finally {
            setLoading(false);
        }
    };

    const createQuestion = async (data: CreateQuestionDTO) => {
        if (!accessToken) return;
        try {
            await questionService.createQuestion(accessToken, data);
            await fetchQuestions(data.quizId);
            return true;
        } catch (error: any) {
            console.error('Error creating question:', error);
            throw new Error(error.message || 'Erro ao criar pergunta');
        }
    };

    const deleteQuestion = async (questionId: string) => {
        if (!accessToken) return;
        try {
            await questionService.deleteQuestion(accessToken, questionId);
            await fetchQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
            throw new Error('Erro ao excluir pergunta');
        }
    };

    return {
        questions,
        loading,
        error,
        createQuestion,
        deleteQuestion,
        refreshQuestions: fetchQuestions
    };
}
