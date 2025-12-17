/**
 * DIAGRAMA DE ARQUITETURA
 * 
 * Componente visual que renderiza o diagrama da arquitetura do sistema.
 * Útil para documentação viva e apresentação do projeto.
 * 
 * CONCEITOS VISUALIZADOS:
 * - Frontend (PWA)
 * - Backend (BFF / Monólito Modular)
 * - Camadas de Domínio (Auth, Quiz, Ranking, etc.)
 * - Infraestrutura (Supabase, Database)
 */

import React from 'react';
import { Server, Database, Shield, FileText, BarChart3, Award, PlaySquare } from 'lucide-react';

export function ArchitectureDiagram() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-gray-900 mb-4">Arquitetura do Sistema</h1>
          <p className="text-gray-600">
            Monólito Modular com Domain-Driven Design (DDD)
          </p>
        </div>

        {/* Architecture Layers */}
        <div className="space-y-8">
          {/* Frontend Layer */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900">Frontend (PWA)</h2>
                <p className="text-gray-600 text-sm">React + TypeScript + Tailwind CSS</p>
              </div>
            </div>
            <div className="flex items-center justify-center text-blue-600">
              <div className="text-center">
                <p className="text-sm">HTTPS / REST API</p>
                <div className="text-2xl">↓</div>
              </div>
            </div>
          </div>

          {/* Backend Layer - Operador */}
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-600 rounded-lg">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900">Operador (BFF - Backend for Frontend)</h2>
                <p className="text-gray-600 text-sm">Monólito Modular - API First</p>
              </div>
            </div>

            {/* Core Domain */}
            <div className="bg-white rounded-xl p-4 mb-4 border-2 border-green-300">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-green-600">●</span>
                Core Domain (Domínio Principal)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quiz Session */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <PlaySquare className="w-5 h-5 text-green-700" />
                    <h4 className="text-gray-800">Quiz Session</h4>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">Gerencia sessões de quiz</p>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    REQ 06
                  </span>
                </div>

                {/* Scoring */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-green-700" />
                    <h4 className="text-gray-800">Scoring</h4>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">Calcula pontuações</p>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    REQ 07
                  </span>
                </div>

                {/* Ranking */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-700" />
                    <h4 className="text-gray-800">Ranking</h4>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">Rankings com cache</p>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    REQ 08
                  </span>
                </div>
              </div>
            </div>

            {/* Generic Domains */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-300">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-gray-600">●</span>
                Generic Domains (Domínios Genéricos)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CMS */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <h4 className="text-gray-800">CMS Module</h4>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">Gestão de conteúdo</p>
                  <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                    REQ 04
                  </span>
                </div>

                {/* Auth */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-gray-700" />
                    <h4 className="text-gray-800">Auth Module</h4>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">Autenticação OAuth2</p>
                  <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                    REQ 09
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Layer */}
          <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900">Infraestrutura</h2>
                <p className="text-gray-600 text-sm">Supabase - Provedor Gerenciado</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="text-gray-800 mb-2">Supabase Auth</h4>
                <p className="text-gray-600 text-xs">OAuth2 / JWT Tokens</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="text-gray-800 mb-2">KV Store</h4>
                <p className="text-gray-600 text-xs">Persistência + Cache</p>
              </div>
            </div>
          </div>

          {/* NFR Section */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
            <h2 className="text-gray-900 mb-4">Requisitos Não-Funcionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h4 className="text-gray-800 mb-2">⚡ Elasticidade</h4>
                <p className="text-gray-600 text-xs">Cache (TTL 30s), Auto-scaling</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h4 className="text-gray-800 mb-2">👁️ Observabilidade</h4>
                <p className="text-gray-600 text-xs">Logs, Metrics, Health checks</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h4 className="text-gray-800 mb-2">🔧 Manutenibilidade</h4>
                <p className="text-gray-600 text-xs">Modular, TypeScript, CI/CD</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
