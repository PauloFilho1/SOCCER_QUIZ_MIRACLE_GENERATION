/**
 * SERVIÇO DE PAGAMENTOS
 * 
 * Gerencia transações financeiras, especificamente geração de PIX e consulta de saldo.
 * 
 * PADRÕES:
 * - Service Object: Centraliza a lógica de pagamentos.
 * - Mock/Stub: Atualmente simula a integração com gateway de pagamento (ex: Mercado Pago, Stripe)
 *   e o backend, retornando dados fictícios para desenvolvimento frontend.
 * - DTO: Interface 'Transaction' define a estrutura dos dados de transação.
 */

import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface Transaction {
    id: string;
    amount: number;
    credits: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
    qrCode?: string;
    qrCodeBase64?: string;
}

export const paymentService = {
    /**
     * Cria uma nova transação de compra de créditos via PIX.
     * 
     * @param token Token de autenticação
     * @param amount Valor em reais
     */
    async createTransaction(token: string, amount: number): Promise<Transaction> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: Math.random().toString(36).substring(7),
                    amount,
                    credits: amount * 10, // Regra de Negócio (Mock): 1 BRL = 10 Créditos
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    qrCode: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Soccer Quiz6008Brasilia62070503***6304E2CA',
                    qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                });
            }, 1000);
        });
    },

    /**
     * Verifica o status de uma transação existente.
     * Utilizado para polling (verificar se o pagamento foi confirmado).
     */
    async getTransactionStatus(token: string, transactionId: string): Promise<Transaction> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: transactionId,
                    amount: 10,
                    credits: 100,
                    status: 'completed',
                    createdAt: new Date().toISOString()
                });
            }, 500);
        });
    },

    /**
     * Consulta o saldo atual de créditos do usuário.
     */
    async getWalletBalance(token: string): Promise<{ credits: number }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ credits: 150 });
            }, 500);
        });
    }
};
