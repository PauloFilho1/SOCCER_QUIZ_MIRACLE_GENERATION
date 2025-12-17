/**
 * MODAL DE PAGAMENTO
 * 
 * Componente modal para compra de créditos no sistema.
 * 
 * FUNCIONALIDADES:
 * - Seleção de pacotes de créditos (valores pré-definidos).
 * - Geração de QR Code PIX (via hook usePayment).
 * - Funcionalidade de "Copiar e Colar" código PIX.
 * - Simulação de confirmação de pagamento (para fins de demonstração/mock).
 * 
 * ARQUITETURA:
 * - Custom Hook Pattern: Toda a lógica de transação é delegada para 'usePayment'.
 * - Modal Pattern: Renderização condicional baseada na prop 'isOpen'.
 */

import React, { useState } from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';
import { usePayment } from '../hooks/usePayment';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
    // Separação de Lógica (Hook) e UI
    const { loading, error, currentTransaction, createTransaction, checkStatus } = usePayment();
    
    // Estado Local de UI
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    /**
     * Seleciona o valor do pacote de créditos.
     */
    const handleSelectAmount = (amount: number) => {
        setSelectedAmount(amount);
    };

    /**
     * Inicia o processo de criação da transação PIX.
     */
    const handlePay = async () => {
        if (selectedAmount) {
            await createTransaction(selectedAmount);
        }
    };

    /**
     * Copia o código PIX para a área de transferência.
     */
    const handleCopyPix = () => {
        if (currentTransaction?.qrCode) {
            navigator.clipboard.writeText(currentTransaction.qrCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    /**
     * Simula a confirmação do pagamento pelo banco.
     * (Em produção, isso seria via WebSocket ou Polling automático)
     */
    const handleSimulatePayment = async () => {
        if (currentTransaction) {
            const isCompleted = await checkStatus(currentTransaction.id);
            if (isCompleted) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                }, 2000);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-[#5DA952] p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Comprar Créditos</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h3>
                            <p className="text-gray-600">Seus créditos foram adicionados.</p>
                        </div>
                    ) : currentTransaction ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-gray-600 mb-2">Total a pagar</p>
                                <p className="text-3xl font-bold text-[#5DA952]">
                                    R$ {currentTransaction.amount.toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[200px]">
                                {/* Placeholder for QR Code Image */}
                                <div className="w-48 h-48 bg-gray-200 mb-4 flex items-center justify-center text-gray-400">
                                    QR Code Mock
                                </div>
                                <p className="text-sm text-gray-500 text-center">
                                    Escaneie o QR Code com seu app de banco
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-2">Ou copie o código PIX:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={currentTransaction.qrCode}
                                        readOnly
                                        className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 truncate"
                                    />
                                    <button
                                        onClick={handleCopyPix}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors"
                                        title="Copiar"
                                    >
                                        {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleSimulatePayment}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-colors"
                            >
                                Simular Pagamento (Dev)
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-4 text-center">Selecione um pacote de créditos:</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[
                                    { credits: 50, amount: 5 },
                                    { credits: 100, amount: 10 },
                                    { credits: 250, amount: 25 },
                                    { credits: 500, amount: 50 },
                                ].map((pkg) => (
                                    <button
                                        key={pkg.credits}
                                        onClick={() => handleSelectAmount(pkg.amount)}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedAmount === pkg.amount
                                                ? 'border-[#5DA952] bg-green-50'
                                                : 'border-gray-200 hover:border-green-200'
                                            }`}
                                    >
                                        <p className="text-xl font-bold text-gray-800">{pkg.credits} Créditos</p>
                                        <p className="text-[#5DA952] font-semibold">R$ {pkg.amount.toFixed(2)}</p>
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePay}
                                disabled={!selectedAmount || loading}
                                className="w-full bg-[#5DA952] hover:bg-[#4F9844] text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Gerando PIX...' : 'Pagar com PIX'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
