/**
 * ARQUITETURA: BACKEND FOR FRONTEND (BFF)
 * 
 * Este arquivo serve como o ponto de entrada principal para a camada de servidor (Edge Functions).
 * Ele implementa o padrão BFF, atuando como uma camada de agregação e adaptação para o frontend.
 * 
 * PRINCÍPIOS E PADRÕES UTILIZADOS:
 * 1. Domain-Driven Design (DDD): O sistema é dividido em módulos de domínio (Auth, CMS, Quiz, Ranking).
 * 2. Single Responsibility Principle (SRP): Este arquivo é responsável apenas pelo roteamento e orquestração HTTP.
 *    A lógica de negócios é delegada para os módulos específicos.
 * 3. Observabilidade: Implementação de logs e endpoints de métricas para monitoramento.
 * 4. Segurança: Middleware de CORS e verificações de autenticação em cada rota protegida.
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

// Módulos de Domínio (Injeção de Dependências / Composição)
import { AuthModule } from "./auth-module.tsx";
import { CMSModule } from "./cms-module.tsx";
import { QuizSessionModule } from "./quiz-session-module.tsx";
import { ScoringModule } from "./scoring-module.tsx";
import { RankingModule } from "./ranking-module.tsx";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Inicialização dos Módulos de Domínio
// Aqui aplicamos o princípio de composição, onde o servidor orquestra os diferentes domínios.
const authModule = new AuthModule();
const cmsModule = new CMSModule();
const quizSessionModule = new QuizSessionModule();
const scoringModule = new ScoringModule();
const rankingModule = new RankingModule();

// Middleware de Observabilidade: Logging de todas as requisições
app.use('*', logger(console.log));

// Configuração de CORS (Cross-Origin Resource Sharing)
// Permite que o frontend (SPA) se comunique com este backend de forma segura.
app.use(
  "/*",
  cors({
    origin: "*", // Em produção, isso deve ser restrito ao domínio do frontend
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

/**
 * ENDPOINT DE HEALTH CHECK
 * Utilizado para verificar a disponibilidade do serviço e de seus subsistemas.
 * Essencial para orquestradores de contêineres e monitoramento de uptime.
 */
app.get("/make-server-4d5764ce/health", (c) => {
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    modules: {
      auth: "ready",
      cms: "ready",
      quizSession: "ready",
      scoring: "ready",
      ranking: "ready"
    }
  });
});

/**
 * ENDPOINT DE MÉTRICAS (OBSERVABILIDADE)
 * Fornece dados agregados sobre o estado do sistema para dashboards administrativos.
 */
app.get("/make-server-4d5764ce/metrics", async (c) => {
  try {
    const totalQuestions = await cmsModule.countQuestions();
    const rankingStats = await rankingModule.getRankingStats();

    return c.json({
      questions: {
        total: totalQuestions
      },
      ranking: rankingStats
    });
  } catch (error) {
    console.error(`Error fetching metrics: ${error}`);
    return c.json({ error: 'Error fetching metrics' }, 500);
  }
});

// ============================================
// AUTH MODULE ROUTES (Domínio Genérico)
// Responsável por Autenticação e Gestão de Identidade
// ============================================

/**
 * Rota de Cadastro (Sign Up) - REQ 09
 * Delega a criação do usuário para o AuthModule.
 */
app.post("/make-server-4d5764ce/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    const user = await authModule.signUp(email, password, name, role);

    return c.json({ 
      success: true, 
      user
    });
  } catch (error) {
    console.error(`Auth error during sign up: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

/**
 * Rota de Perfil do Usuário
 * Utiliza o token JWT para identificar o usuário (Stateless Authentication).
 */
app.get("/make-server-4d5764ce/user/profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await authModule.getUserProfile(user.id);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.error(`Error fetching user profile: ${error}`);
    return c.json({ error: 'Internal server error while fetching profile' }, 500);
  }
});

/**
 * Atualização de Perfil (REQ 01)
 * Permite ao usuário modificar seus dados cadastrais.
 */
app.put("/make-server-4d5764ce/user/profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    await authModule.updateUserProfile(user.id, updates);
    const profile = await authModule.getUserProfile(user.id);
    return c.json({ profile });
  } catch (error) {
    console.error(`Error updating profile: ${error}`);
    return c.json({ error: 'Internal server error while updating profile' }, 500);
  }
});

/**
 * Exclusão de Conta (REQ 01)
 * Remove o usuário e limpa sessões ativas, garantindo consistência dos dados.
 */
app.delete("/make-server-4d5764ce/user/profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Limpeza de sessão ativa (Cache Invalidation)
    const activeSession = await kv.get(`user:${user.id}:active_session`);
    if (activeSession) {
      await kv.del(activeSession);
      await kv.del(`user:${user.id}:active_session`);
    }

    await authModule.deleteUser(user.id);
    return c.json({ success: true });
  } catch (error) {
    console.error(`Error deleting profile: ${error}`);
    return c.json({ error: 'Internal server error while deleting profile' }, 500);
  }
});

// ============================================
// CMS MODULE ROUTES (Domínio Genérico)
// Responsável pela Gestão de Conteúdo (Quizzes, Perguntas, Times)
// ============================================

/**
 * Criação de Quiz (Admin)
 * Verifica permissões de administrador antes de delegar ao CMSModule.
 */
app.post("/make-server-4d5764ce/quizzes", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { name, description, team, timeLimit } = await c.req.json();
    const quiz = await cmsModule.createQuiz(name, description, team, timeLimit, user.id);

    return c.json({ success: true, quiz });
  } catch (error) {
    console.error(`CMS error while creating quiz: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

/**
 * Listagem de Quizzes
 * Acessível para todos os usuários autenticados.
 */
app.get("/make-server-4d5764ce/quizzes", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const quizzes = await cmsModule.listQuizzes();
    return c.json({ quizzes });
  } catch (error) {
    console.error(`CMS error while fetching quizzes: ${error}`);
    return c.json({ error: 'Internal server error while fetching quizzes' }, 500);
  }
});

/**
 * Exclusão de Quiz Específico (Admin)
 * Remove um quiz e seus dados associados.
 */
app.delete("/make-server-4d5764ce/quizzes/:quizId", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const quizId = c.req.param('quizId');
    await cmsModule.deleteQuiz(quizId);

    return c.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error(`Error deleting quiz: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

/**
 * Exclusão de Todos os Quizzes (Admin - Danger Zone)
 * Operação crítica que reseta todo o conteúdo e rankings do sistema.
 */
app.delete("/make-server-4d5764ce/quizzes", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    await cmsModule.deleteAllQuizzes();
    
    // Reset de rankings e recordes para manter consistência
    await rankingModule.resetAllRankings();
    await scoringModule.resetAllFastest();

    return c.json({ success: true, message: 'All quizzes deleted successfully and ranking reset' });
  } catch (error) {
    console.error(`Error deleting all quizzes: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

/**
 * CRUD de Times (REQ 03)
 * Gerenciamento das entidades de Times.
 */
app.post("/make-server-4d5764ce/teams", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const { name, description } = await c.req.json();
    const team = await cmsModule.createTeam(name, description, user.id);
    return c.json({ success: true, team });
  } catch (error) {
    console.error(`CMS error while creating team: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

app.get("/make-server-4d5764ce/teams", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const teams = await cmsModule.listTeams();
    return c.json({ teams });
  } catch (error) {
    console.error(`CMS error while listing teams: ${error}`);
    return c.json({ error: 'Internal server error while listing teams' }, 500);
  }
});

app.put("/make-server-4d5764ce/teams/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const teamId = c.req.param('id');
    const updates = await c.req.json();
    const team = await cmsModule.updateTeam(teamId, updates);
    return c.json({ success: true, team });
  } catch (error) {
    console.error(`CMS error while updating team: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

app.delete("/make-server-4d5764ce/teams/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const teamId = c.req.param('id');
    await cmsModule.deleteTeam(teamId);
    return c.json({ success: true });
  } catch (error) {
    console.error(`CMS error while deleting team: ${error}`);
    return c.json({ error: 'Internal server error while deleting team' }, 500);
  }
});

/**
 * Criação de Perguntas (REQ 04)
 * Associa perguntas a quizzes e times específicos.
 */
app.post("/make-server-4d5764ce/questions", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { question, options, correctAnswer, team, quizId } = await c.req.json();

    const createdQuestion = await cmsModule.createQuestion(
      question,
      options,
      correctAnswer,
      team,
      user.id,
      quizId
    );

    return c.json({ success: true, question: createdQuestion });
  } catch (error) {
    console.error(`CMS error while creating question: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

/**
 * Listagem de Perguntas
 * Permite filtrar perguntas por Quiz ID.
 */
app.get("/make-server-4d5764ce/questions", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const quizId = c.req.query('quizId') || undefined;
    const questions = await cmsModule.listQuestions(quizId);

    return c.json({ questions });
  } catch (error) {
    console.error(`CMS error while fetching questions: ${error}`);
    return c.json({ error: 'Internal server error while fetching questions' }, 500);
  }
});

/**
 * Exclusão de Pergunta (Admin)
 */
app.delete("/make-server-4d5764ce/questions/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const questionId = c.req.param('id');
    await cmsModule.deleteQuestion(questionId);

    return c.json({ success: true });
  } catch (error) {
    console.error(`CMS error while deleting question: ${error}`);
    return c.json({ error: 'Internal server error while deleting question' }, 500);
  }
});

// ============================================
// OPERADOR - QUIZ SESSION MODULE (Core Domain)
// Gerencia o ciclo de vida de uma sessão de quiz ativa
// ============================================

/**
 * Início de Sessão de Quiz (REQ 06)
 * Inicializa o estado da sessão e dispara notificações de broadcast.
 */
app.post("/make-server-4d5764ce/quiz/start", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { team, quizId } = await c.req.json();

    const result = await quizSessionModule.startSession(user.id, quizId, team);

    // Padrão Observer/Pub-Sub: Notifica outros usuários sobre o início do quiz (REQ 17)
    const quizData = await cmsModule.getQuiz(quizId);
    if (quizData) {
      await cmsModule.broadcastNotification({
        type: 'new_quiz',
        title: 'Quiz em andamento!',
        message: `${user.name} iniciou o quiz "${quizData.name}". Boa sorte!`
      });
    }

    return c.json({ 
      success: true, 
      ...result
    });
  } catch (error) {
    console.error(`Quiz Session error while starting quiz: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

/**
 * Obter Pergunta Atual
 * Retorna o estado atual da sessão do usuário.
 */
app.get("/make-server-4d5764ce/quiz/current", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await quizSessionModule.getCurrentQuestion(user.id);

    return c.json(result);
  } catch (error) {
    console.error(`Quiz Session error while getting current question: ${error}`);
    return c.json({ error: String(error) }, 404);
  }
});

/**
 * Submissão de Resposta
 * Processa a resposta do usuário e atualiza o estado da sessão.
 */
app.post("/make-server-4d5764ce/quiz/answer", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { answer } = await c.req.json();

    const result = await quizSessionModule.submitAnswer(user.id, answer);

    return c.json(result);
  } catch (error) {
    console.error(`Quiz Session error while submitting answer: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

// ============================================
// OPERADOR - SCORING MODULE (Core Domain)
// Responsável pelo cálculo de pontuação e estatísticas
// ============================================

/**
 * Finalização de Quiz (REQ 07)
 * Calcula a pontuação final e persiste os resultados.
 */
app.post("/make-server-4d5764ce/quiz/finish", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await scoringModule.finishQuiz(user.id);

    // Invalidação de Cache: Garante que o ranking reflita os dados mais recentes
    await rankingModule.invalidateCache();

    return c.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error(`Scoring error while finishing quiz: ${error}`);
    return c.json({ error: String(error) }, 400);
  }
});

/**
 * Estatísticas do Usuário
 */
app.get("/make-server-4d5764ce/user/stats", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const stats = await scoringModule.getUserStats(user.id);

    return c.json({ stats });
  } catch (error) {
    console.error(`Scoring error while fetching user stats: ${error}`);
    return c.json({ error: 'Internal server error while fetching stats' }, 500);
  }
});

// ============================================
// OPERADOR - RANKING MODULE (Core Domain)
// Gerencia a classificação global e recordes
// ============================================

/**
 * Obter Ranking Global (REQ 08)
 * Utiliza estratégia de cache para garantir alta disponibilidade e performance (Elasticidade).
 */
app.get("/make-server-4d5764ce/ranking", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const ranking = await rankingModule.getGlobalRanking();

    return c.json({ ranking });
  } catch (error) {
    console.error(`Ranking error while fetching ranking: ${error}`);
    return c.json({ error: 'Internal server error while fetching ranking' }, 500);
  }
});

/**
 * Reset de Ranking (Admin)
 * Permite reiniciar a competição.
 */
app.post("/make-server-4d5764ce/ranking/reset", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    await rankingModule.resetAllRankings();
    await scoringModule.resetAllFastest();

    return c.json({ success: true, message: 'All rankings and fastest records have been reset' });
  } catch (error) {
    console.error(`Error resetting rankings: ${error}`);
    return c.json({ error: 'Internal server error while resetting rankings' }, 500);
  }
});

/**
 * Jogador Mais Rápido (REQ 13)
 * Retorna o recordista de tempo para um quiz específico.
 */
app.get("/make-server-4d5764ce/ranking/fastest/:quizId", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const quizId = c.req.param('quizId');
    const entry = await scoringModule.getFastestByQuiz(quizId);
    return c.json({ fastest: entry });
  } catch (error) {
    console.error(`Ranking error while fetching fastest: ${error}`);
    return c.json({ error: 'Internal server error while fetching fastest' }, 500);
  }
});

// ============================================
// NOTIFICAÇÕES (REQ 17)
// ============================================
app.get("/make-server-4d5764ce/notifications", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const notifications = await cmsModule.listNotifications(user.id);
    return c.json({ notifications });
  } catch (error) {
    console.error(`Error listing notifications: ${error}`);
    return c.json({ error: 'Internal server error while listing notifications' }, 500);
  }
});

// ============================================
// CONVITES (REQ 11)
// ============================================
app.post("/make-server-4d5764ce/invites", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email is required' }, 400);

    const token = Math.random().toString(36).slice(2, 10);
    const invite = {
      id: `invite:${Date.now()}:${token}`,
      email,
      invitedBy: user.id,
      token,
      createdAt: new Date().toISOString()
    };

    const invitesList = await kv.get('invites:list');
    const list = invitesList ? JSON.parse(invitesList) : [];
    list.unshift(invite.id);
    await kv.set('invites:list', JSON.stringify(list.slice(0, 200)));
    await kv.set(invite.id, JSON.stringify(invite));

    // O envio de email é delegado ao frontend (EmailJS) para reduzir carga no backend
    console.log('Invite created successfully. Email will be sent from frontend.');

    return c.json({ success: true, invite });
  } catch (error) {
    console.error(`Error creating invite: ${error}`);
    return c.json({ error: 'Internal server error while creating invite' }, 500);
  }
});

app.get("/make-server-4d5764ce/invites", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await authModule.isAdmin(user.id);
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const invitesList = await kv.get('invites:list');
    if (!invitesList) return c.json({ invites: [] });
    const ids: string[] = JSON.parse(invitesList);
    const items = await kv.mget(ids);
    const invites = items.filter(Boolean).map((i) => JSON.parse(i as string));
    return c.json({ invites });
  } catch (error) {
    console.error(`Error listing invites: ${error}`);
    return c.json({ error: 'Internal server error while listing invites' }, 500);
  }
});

/**
 * Top Jogadores
 */
app.get("/make-server-4d5764ce/ranking/top/:limit", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.param('limit')) || 10;
    const topPlayers = await rankingModule.getTopPlayers(limit);

    return c.json({ topPlayers });
  } catch (error) {
    console.error(`Ranking error while fetching top players: ${error}`);
    return c.json({ error: 'Internal server error while fetching top players' }, 500);
  }
});

/**
 * Posição do Usuário no Ranking
 */
app.get("/make-server-4d5764ce/ranking/position", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await authModule.getAuthenticatedUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const position = await rankingModule.getUserPosition(user.id);

    return c.json({ position });
  } catch (error) {
    console.error(`Ranking error while fetching user position: ${error}`);
    return c.json({ error: 'Internal server error while fetching position' }, 500);
  }
});

// Middleware de Tratamento de Erros Global
// Garante que exceções não tratadas não derrubem o servidor e retornem respostas padronizadas.
app.onError((err, c) => {
  console.error(`Unhandled error: ${err.message}`, err);
  return c.json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500);
});

// Inicialização do Servidor
Deno.serve(app.fetch);