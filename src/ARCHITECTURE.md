# Arquitetura do Sistema - Quiz de Futebol ⚽

## 📐 Visão Geral da Arquitetura

### Estilo Arquitetural: Monólito Modular com DDD

O sistema segue uma arquitetura de **Monólito Modular** para o núcleo do negócio ("Operador"), utilizando conceitos de **Domain-Driven Design (DDD)** para separar o domínio principal dos domínios genéricos.

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND (PWA)                       │
│                    React + TypeScript                        │
│                     Tailwind CSS                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           OPERADOR (BFF - Backend for Frontend)             │
│                  Monólito Modular - API First                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         CORE DOMAIN (Domínio Principal)            │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │    │
│  │  │ Quiz Session │  │   Scoring    │  │ Ranking │ │    │
│  │  │   Module     │  │   Module     │  │ Module  │ │    │
│  │  └──────────────┘  └──────────────┘  └─────────┘ │    │
│  │                                                     │    │
│  │  REQ 06: Disputar Quiz                             │    │
│  │  REQ 07: Encerrar Quiz                             │    │
│  │  REQ 08: Visualizar Ranking                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │      GENERIC DOMAINS (Domínios Genéricos)          │    │
│  │                                                     │    │
│  │  ┌──────────┐           ┌──────────────┐          │    │
│  │  │   CMS    │           │     Auth     │          │    │
│  │  │  Module  │           │    Module    │          │    │
│  │  └──────────┘           └──────────────┘          │    │
│  │                                                     │    │
│  │  REQ 04: Cadastrar Pergunta                        │    │
│  │  REQ 09: Logar no Sistema                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Supabase Auth  │
              │  (OAuth2/JWT)   │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    KV Store     │
              │  (Persistence)  │
              └─────────────────┘
```

## 🏗️ Módulos do Sistema

### **Core Domain (Operador)**

#### 1. **Quiz Session Module** 
**Responsabilidade**: Gerenciar o ciclo de vida das sessões de quiz  
**Requisito**: REQ 06 - Disputar Quiz

**Funcionalidades**:
- Iniciar nova sessão de quiz
- Gerenciar estado da sessão (ativa/completa)
- Fornecer pergunta atual
- Processar resposta do jogador
- Randomização de perguntas (Fisher-Yates)
- Validação de segurança (não expor resposta correta)

**API Endpoints**:
- `POST /quiz/start` - Inicia sessão
- `GET /quiz/current` - Obtém pergunta atual
- `POST /quiz/answer` - Submete resposta

#### 2. **Scoring Module**
**Responsabilidade**: Calcular e gerenciar pontuações  
**Requisito**: REQ 07 - Encerrar Quiz

**Funcionalidades**:
- Finalizar sessão de quiz
- Calcular pontuação final
- Atualizar perfil do usuário
- Registrar histórico de pontuações
- Calcular estatísticas (média, total)

**Regras de Negócio**:
- +100 pontos por resposta correta
- 0 pontos por resposta incorreta
- Pontuação acumulativa por usuário

**API Endpoints**:
- `POST /quiz/finish` - Finaliza quiz
- `GET /user/stats` - Obtém estatísticas

#### 3. **Ranking Module**
**Responsabilidade**: Gerenciar e calcular rankings  
**Requisito**: REQ 08 - Visualizar Ranking

**Funcionalidades**:
- Calcular ranking global
- Cache de ranking (TTL 30s)
- Invalidação de cache
- Top N jogadores
- Posição específica de usuário
- Estatísticas gerais

**Táticas de Elasticidade**:
- Cache em memória (KV Store)
- TTL configurável (30 segundos)
- Invalidação automática após quiz
- Otimização de leitura

**API Endpoints**:
- `GET /ranking` - Ranking global (cached)
- `GET /ranking/top/:limit` - Top N
- `GET /ranking/position` - Posição do usuário

### **Generic Domains (Domínios Genéricos)**

#### 4. **CMS Module**
**Responsabilidade**: Gestão de conteúdo (perguntas, respostas, times)  
**Requisito**: REQ 04 - Cadastrar Pergunta

**Funcionalidades**:
- CRUD de perguntas
- Validação de dados
- Categorização por time
- Listagem e busca
- Controle de acesso (admin only)

**API Endpoints**:
- `POST /questions` - Criar pergunta
- `GET /questions` - Listar perguntas
- `DELETE /questions/:id` - Excluir pergunta

#### 5. **Auth Module**
**Responsabilidade**: Autenticação e autorização  
**Requisito**: REQ 09 - Logar no Sistema

**Funcionalidades**:
- Integração com Supabase Auth (OAuth2/JWT)
- Criação de usuários
- Validação de tokens
- Gestão de perfis
- Controle de roles (player/admin)

**API Endpoints**:
- `POST /auth/signup` - Cadastro
- `GET /user/profile` - Perfil do usuário

## 🎯 Decisões Arquiteturais (ADRs)

### ADR-001: Monólito Modular

**Decisão**: Implementar o Operador como monólito modular

**Contexto**: 
- Sistema de porte médio
- Equipe reduzida
- Necessidade de simplicidade operacional

**Justificativa**:
- Facilita desenvolvimento e deployment
- Mantém modularização interna clara
- Permite evolução para microserviços se necessário
- Reduz complexidade de rede e latência

### ADR-002: Domain-Driven Design

**Decisão**: Separar domínio principal de domínios genéricos

**Contexto**:
- Quiz é o core domain
- CMS e Auth são domínios de suporte

**Justificativa**:
- Foco em regras de negócio do quiz
- Modularização clara
- Facilita manutenção e testes
- Permite substituição de domínios genéricos

### ADR-003: API First / BFF Pattern

**Decisão**: Operador atua como Backend for Frontend

**Contexto**:
- Frontend PWA precisa de API específica
- Necessidade de agregação de dados

**Justificativa**:
- Otimiza comunicação frontend-backend
- Reduz número de requisições
- Controla formato de resposta
- Facilita versionamento

### ADR-004: Cache Strategy para Ranking

**Decisão**: Implementar cache com TTL de 30s

**Contexto**:
- Ranking é endpoint de alta leitura
- Dados não precisam ser real-time

**Justificativa**:
- Reduz carga no banco de dados
- Melhora performance e latência
- Suporta picos de acesso
- TTL balanceado (freshness vs performance)

## 📊 Requisitos Não-Funcionais

### 1. **Disponibilidade e Elasticidade**

**Objetivo**: Suportar janelas curtas de alto tráfego

**Táticas Implementadas**:
- ✅ Cache de ranking (CDN/KV Store)
- ✅ Arquitetura stateless (horizontal scaling ready)
- ✅ TTL configurável para cache
- ✅ Invalidação inteligente de cache

**Pontos de Escala**:
- Edge Functions (Supabase) - Auto-scaling
- KV Store - Distribuído e replicado
- Auth - Gerenciado (Supabase)

### 2. **Observabilidade**

**Objetivo**: Diagnóstico rápido de incidentes

**Implementações**:
- ✅ Logging estruturado (console.log com contexto)
- ✅ Error tracking (try-catch em todas as rotas)
- ✅ Health check endpoint (`/health`)
- ✅ Metrics endpoint (`/metrics`)
- ✅ Timestamps em logs e erros

**Métricas Expostas**:
- Total de perguntas cadastradas
- Total de jogadores
- Pontuação média
- Pontuação mais alta

### 3. **Manutenibilidade**

**Objetivo**: Código fácil de operar e evoluir

**Práticas**:
- ✅ Separação de módulos por domínio
- ✅ Tipos TypeScript compartilhados
- ✅ Documentação inline
- ✅ Código autodocumentado
- ✅ Estrutura de pastas clara
- ✅ CI/CD ready (Edge Functions)

## 🔐 Segurança

### Autenticação
- OAuth2 via Supabase Auth
- JWT tokens para sessões
- Validação de token em todas as rotas protegidas

### Autorização
- Role-based access control (RBAC)
- Admin vs Player separation
- Endpoint protection por role

### Validação
- Validação de entrada em todos os endpoints
- Sanitização de dados
- Não exposição de respostas corretas antes da submissão

## 📦 Estrutura de Dados

### KV Store Schema

```
user_role:{userId}
  → "admin" | "player"

user_profile:{userId}
  → { id, email, name, role, totalScore, gamesPlayed }

question:{timestamp}:{random}
  → { id, question, options, correctAnswer, team, createdBy, createdAt }

questions:list
  → [questionIds...]

session:{userId}:{timestamp}
  → { sessionId, userId, questions, score, answers, status, ... }

user:{userId}:active_session
  → sessionId

ranking:{timestamp}:{userId}
  → { userId, sessionId, score, completedAt }

ranking:cache
  → [RankingEntry...]

ranking:cache:timestamp
  → timestamp (for TTL validation)
```

## 🚀 Deployment

### Backend (Operador)
- **Platform**: Supabase Edge Functions (Deno)
- **Scaling**: Automático
- **Region**: Global (Edge network)

### Frontend (PWA)
- **Platform**: Static hosting + CDN
- **Offline**: Service Worker
- **Install**: Progressive Web App

### Database
- **Type**: KV Store (Supabase)
- **Replication**: Managed by Supabase
- **Backup**: Managed by Supabase

## 📈 Evolução Futura

### Possíveis Melhorias:
1. **Analytics Module**: Rastreamento de eventos e métricas de uso
2. **Notification Module**: Notificações push para quiz schedules
3. **Real-time Ranking**: WebSockets para ranking ao vivo
4. **Advanced Cache**: Redis para cache distribuído
5. **CDN**: CloudFlare para assets estáticos
6. **Monitoring**: Grafana + Prometheus
7. **Rate Limiting**: Proteção contra abuso

### Migração para Microserviços:
Se necessário no futuro, os módulos já estão preparados para serem extraídos como serviços independentes, mantendo as mesmas interfaces de API.

## 📝 Conclusão

Esta arquitetura balanceia simplicidade operacional com modularização clara, permitindo crescimento gradual do sistema mantendo alta qualidade e performance. O foco em DDD garante que o domínio principal (Quiz) esteja protegido e bem definido, enquanto os domínios genéricos podem ser substituídos ou evoluídos independentemente.
