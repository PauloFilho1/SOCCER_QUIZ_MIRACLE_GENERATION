import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentService, Transaction } from '../services/paymentService';

export function usePayment() {
    const { accessToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

    const createTransaction = async (amount: number) => {
        if (!accessToken) return;
        setLoading(true);
        setError('');
        try {
            const transaction = await paymentService.createTransaction(accessToken, amount);
            setCurrentTransaction(transaction);
            return transaction;
        } catch (err: any) {
            setError(err.message || 'Erro ao criar transação');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async (transactionId: string) => {
        if (!accessToken) return;
        try {
            const transaction = await paymentService.getTransactionStatus(accessToken, transactionId);
            if (transaction.status === 'completed') {
                setCurrentTransaction(null);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error checking status:', err);
            return false;
        }
    };

    return {
        loading,
        error,
        currentTransaction,
        createTransaction,
        checkStatus
    };
}
