/**
 * MÓDULO CMS (CONTENT MANAGEMENT SYSTEM)
 * 
 * Este módulo implementa a lógica de negócios para o gerenciamento de conteúdo do sistema.
 * Ele segue o princípio de Single Responsibility Principle (SRP), focando exclusivamente
 * na criação, leitura, atualização e exclusão (CRUD) de entidades de conteúdo.
 * 
 * ENTIDADES GERENCIADAS:
 * - Times (Teams)
 * - Quizzes
 * - Perguntas (Questions)
 * - Notificações (Notifications)
 * 
 * PADRÕES DE PROJETO:
 * - Repository Pattern: Abstração do acesso a dados via 'kv_store'.
 * - Observer Pattern: Implementado no método 'broadcastNotification' para disseminar eventos.
 */

import * as kv from "./kv_store.tsx";
import type { Question, Quiz, Team, Notification } from "./types.tsx";

export class CMSModule {
  /**
   * Criação de Time (REQ 03)
   * Persiste uma nova entidade de time no banco de dados KV.
   */
  async createTeam(name: string, description: string | undefined, createdBy: string): Promise<Team> {
    if (!name) throw new Error('Team name is required');

    const teamId = `team:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`;
    const team: Team = {
      id: teamId,
      name,
      description: description || '',
      createdBy,
      createdAt: new Date().toISOString()
    };

    // Persistência atômica (simulada)
    const teamsList = await kv.get('teams:list');
    const teams = teamsList ? JSON.parse(teamsList) : [];
    teams.push(teamId);
    await kv.set('teams:list', JSON.stringify(teams));
    await kv.set(teamId, JSON.stringify(team));
    return team;
  }

  /**
   * Listagem de Times
   * Recupera todos os times cadastrados utilizando o padrão de lista de IDs.
   */
  async listTeams(): Promise<Team[]> {
    const teamsList = await kv.get('teams:list');
    if (!teamsList) return [];
    const teamIds: string[] = JSON.parse(teamsList);
    const teams = await kv.mget(teamIds);
    return teams.filter(Boolean).map((t) => JSON.parse(t as string));
  }

  /**
   * Atualização de Time
   * Permite modificar dados de um time existente.
   */
  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    const teamStr = await kv.get(teamId);
    if (!teamStr) throw new Error('Team not found');
    const team: Team = JSON.parse(teamStr);
    const updated = { ...team, ...data } as Team;
    await kv.set(teamId, JSON.stringify(updated));
    return updated;
  }

  /**
   * Exclusão de Time
   * Remove o time e atualiza a lista de referência.
   */
  async deleteTeam(teamId: string): Promise<void> {
    const teamsList = await kv.get('teams:list');
    const teams = teamsList ? JSON.parse(teamsList) as string[] : [];
    const filtered = teams.filter((id) => id !== teamId);
    await kv.set('teams:list', JSON.stringify(filtered));
    await kv.del(teamId);
  }

  /**
   * Criação de Quiz
   * Inicializa um novo quiz com lista de perguntas vazia.
   */
  async createQuiz(
    name: string,
    description: string | undefined,
    team: string | undefined,
    timeLimit: number | undefined,
    createdBy: string
  ): Promise<Quiz> {
    if (!name) {
      throw new Error('Quiz name is required');
    }

    const quizId = `quiz:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`;
    const quiz: Quiz = {
      id: quizId,
      name,
      description: description || '',
      team: team || 'general',
      questionIds: [],
      createdBy,
      createdAt: new Date().toISOString(),
      timeLimit: timeLimit || 30
    };

    const quizzesList = await kv.get('quizzes:list');
    const quizzes = quizzesList ? JSON.parse(quizzesList) : [];
    quizzes.push(quizId);
    await kv.set('quizzes:list', JSON.stringify(quizzes));
    await kv.set(quizId, JSON.stringify(quiz));

    return quiz;
  }

  /** 
   * Listagem de Quizzes
   * Retorna todos os quizzes disponíveis no sistema.
   */
  async listQuizzes(): Promise<Quiz[]> {
    const quizzesList = await kv.get('quizzes:list');
    if (!quizzesList) return [];

    const quizIds: string[] = JSON.parse(quizzesList);
    const quizzes = await kv.mget(quizIds);
    
    return quizzes
      .filter(Boolean)
      .map((q) => JSON.parse(q as string));
  }

  /** 
   * Exclusão em Cascata de Quiz
   * Remove o quiz e garante a integridade referencial removendo:
   * 1. Perguntas associadas
   * 2. Sessões ativas deste quiz
   */
  async deleteQuiz(quizId: string): Promise<void> {
    const quizStr = await kv.get(quizId);
    if (!quizStr) throw new Error('Quiz not found');
    
    const quiz: Quiz = JSON.parse(quizStr);
    
    // Remove todas as perguntas associadas a este quiz
    if (quiz.questionIds && quiz.questionIds.length > 0) {
      for (const questionId of quiz.questionIds) {
        await kv.del(questionId);
        
        // Atualiza a lista global de perguntas
        const questionsList = await kv.get('questions:list');
        if (questionsList) {
          const questions = JSON.parse(questionsList) as string[];
          const filtered = questions.filter(id => id !== questionId);
          await kv.set('questions:list', JSON.stringify(filtered));
        }
      }
    }
    
    // Remove o quiz da lista global
    const quizzesList = await kv.get('quizzes:list');
    if (quizzesList) {
      const quizzes = JSON.parse(quizzesList) as string[];
      const filtered = quizzes.filter(id => id !== quizId);
      await kv.set('quizzes:list', JSON.stringify(filtered));
    }
    
    // Remove a entidade do quiz
    await kv.del(quizId);
    
    // Limpa sessões órfãs relacionadas a este quiz
    const sessionsList = await kv.get('sessions:list');
    if (sessionsList) {
      const sessions = JSON.parse(sessionsList) as string[];
      for (const sessionId of sessions) {
        const sessionStr = await kv.get(sessionId);
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.quizId === quizId) {
            await kv.del(sessionId);
            const filtered = sessions.filter(id => id !== sessionId);
            await kv.set('sessions:list', JSON.stringify(filtered));
          }
        }
      }
    }
  }

  /** 
   * Exclusão Total (Danger Zone)
   * Remove todos os quizzes e limpa dados relacionados.
   * Utilizado para resetar o estado do sistema.
   */
  async deleteAllQuizzes(): Promise<void> {
    const quizzesList = await kv.get('quizzes:list');
    if (!quizzesList) return;
    
    const quizIds: string[] = JSON.parse(quizzesList);
    
    // Itera sobre todos os quizzes para realizar a exclusão em cascata
    for (const quizId of quizIds) {
      await this.deleteQuiz(quizId);
    }
    
    // Garante que as listas estejam vazias
    await kv.set('quizzes:list', JSON.stringify([]));
    await kv.set('questions:list', JSON.stringify([]));
    await kv.set('sessions:list', JSON.stringify([]));
  }

  async getQuiz(quizId: string): Promise<Quiz | null> {
    const quizStr = await kv.get(quizId);
    if (!quizStr) {
      return null;
    }
    return JSON.parse(quizStr);
  }

  // Método auxiliar privado para encapsular a lógica de busca ou erro
  private async getQuizOrThrow(quizId: string): Promise<Quiz> {
    const quizStr = await kv.get(quizId);
    if (!quizStr) {
      throw new Error('Quiz not found');
    }
    return JSON.parse(quizStr);
  }

  /**
   * Criação de Pergunta (REQ 04)
   * Valida os dados da pergunta e a associa a um quiz específico.
   */
  async createQuestion(
    question: string,
    options: string[],
    correctAnswer: string,
    team: string,
    createdBy: string,
    quizId: string
  ): Promise<Question> {
    // Validações de Regra de Negócio
    if (!question || !options || !correctAnswer || options.length !== 4) {
      throw new Error('Invalid question data');
    }

    if (!options.includes(correctAnswer)) {
      throw new Error('Correct answer must be one of the options');
    }

    if (!quizId) {
      throw new Error('Quiz is required to create question');
    }

    const quiz = await this.getQuizOrThrow(quizId);

    const questionId = `question:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const questionData: Question = {
      id: questionId,
      question,
      options,
      correctAnswer,
      team: team || 'general',
      createdBy,
      createdAt: new Date().toISOString()
    };

    await kv.set(questionId, JSON.stringify(questionData));

    // Atualiza o agregado Quiz com a nova pergunta (DDD Aggregate)
    quiz.questionIds.push(questionId);
    await kv.set(quizId, JSON.stringify(quiz));

    return questionData;
  }

  /**
   * Listagem de Perguntas
   * Suporta filtragem por Quiz ID.
   */
  async listQuestions(quizId?: string): Promise<Question[]> {
    if (quizId) {
      const quiz = await this.getQuizOrThrow(quizId);
      if (!quiz.questionIds.length) return [];
      const questions = await kv.mget(quiz.questionIds);
      return questions
        .filter(Boolean)
        .map((q) => JSON.parse(q as string));
    }

    // Se nenhum quizId for fornecido, busca todas as perguntas de todos os quizzes
    const quizzes = await this.listQuizzes();
    const allQuestionIds = quizzes.flatMap((q) => q.questionIds);
    if (!allQuestionIds.length) return [];
    const questions = await kv.mget(allQuestionIds);
    return questions
      .filter(Boolean)
      .map((q) => JSON.parse(q as string));
  }

  /**
   * Busca perguntas por time/categoria
   */
  async getQuestionsByTeam(team?: string, quizId?: string): Promise<Question[]> {
    const allQuestions = await this.listQuestions(quizId);
    
    if (!team) {
      return allQuestions;
    }

    return allQuestions.filter(q => q.team === team || q.team === 'general');
  }

  /**
   * Exclusão de Pergunta
   * Remove a pergunta e atualiza as referências nos quizzes.
   */
  async deleteQuestion(questionId: string): Promise<void> {
    // Remove a referência da pergunta de todos os quizzes que a contêm
    const quizzes = await this.listQuizzes();
    for (const quiz of quizzes) {
      if (quiz.questionIds.includes(questionId)) {
        quiz.questionIds = quiz.questionIds.filter((id) => id !== questionId);
        await kv.set(quiz.id, JSON.stringify(quiz));
      }
    }

    await kv.del(questionId);
  }

  /**
   * Contagem de Perguntas (Métrica)
   */
  async countQuestions(): Promise<number> {
    const questionsList = await kv.get('questions:list');
    if (!questionsList) {
      return 0;
    }
    const questions = JSON.parse(questionsList);
    return questions.length;
  }

  // ==========================
  // Notificações (REQ 17)
  // ==========================
  
  /**
   * Broadcast de Notificações (Observer Pattern)
   * Envia uma notificação para todos os usuários cadastrados.
   */
  async broadcastNotification(payload: Omit<Notification, 'id' | 'createdAt' | 'message'> & { message: string }): Promise<void> {
    // Recupera todos os perfis de usuário para distribuição
    const allUsers = await kv.getByPrefix('user_profile:');
    const now = new Date().toISOString();
    
    // Prepara as notificações para cada usuário
    const notificationsByUser = allUsers.map((profileStr: string) => {
      const profile = JSON.parse(profileStr);
      const notification: Notification = {
        id: `notif:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        createdAt: now
      };
      return { key: `notifications:${profile.id}`, notification };
    });

    // Persiste as notificações nas caixas de entrada de cada usuário
    for (const item of notificationsByUser) {
      const list = await kv.get(item.key);
      const arr = list ? JSON.parse(list) : [];
      arr.unshift(item.notification);
      await kv.set(item.key, JSON.stringify(arr.slice(0, 50))); // Mantém apenas as últimas 50
    }
  }

  /**
   * Listagem de Notificações do Usuário
   */
  async listNotifications(userId: string): Promise<Notification[]> {
    const list = await kv.get(`notifications:${userId}`);
    return list ? JSON.parse(list) : [];
  }
}


import * as kv from "./kv_store.tsx";
import type { Question, Quiz, Team, Notification } from "./types.tsx";

export class CMSModule {
  /**
   * REQ 03 - CRUD de Time
   */
  async createTeam(name: string, description: string | undefined, createdBy: string): Promise<Team> {
    if (!name) throw new Error('Team name is required');

    const teamId = `team:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`;
    const team: Team = {
      id: teamId,
      name,
      description: description || '',
      createdBy,
      createdAt: new Date().toISOString()
    };

    const teamsList = await kv.get('teams:list');
    const teams = teamsList ? JSON.parse(teamsList) : [];
    teams.push(teamId);
    await kv.set('teams:list', JSON.stringify(teams));
    await kv.set(teamId, JSON.stringify(team));
    return team;
  }

  async listTeams(): Promise<Team[]> {
    const teamsList = await kv.get('teams:list');
    if (!teamsList) return [];
    const teamIds: string[] = JSON.parse(teamsList);
    const teams = await kv.mget(teamIds);
    return teams.filter(Boolean).map((t) => JSON.parse(t as string));
  }

  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    const teamStr = await kv.get(teamId);
    if (!teamStr) throw new Error('Team not found');
    const team: Team = JSON.parse(teamStr);
    const updated = { ...team, ...data } as Team;
    await kv.set(teamId, JSON.stringify(updated));
    return updated;
  }

  async deleteTeam(teamId: string): Promise<void> {
    const teamsList = await kv.get('teams:list');
    const teams = teamsList ? JSON.parse(teamsList) as string[] : [];
    const filtered = teams.filter((id) => id !== teamId);
    await kv.set('teams:list', JSON.stringify(filtered));
    await kv.del(teamId);
  }

  /**
   * Cria um novo quiz
   */
  async createQuiz(
    name: string,
    description: string | undefined,
    team: string | undefined,
    timeLimit: number | undefined,
    createdBy: string
  ): Promise<Quiz> {
    if (!name) {
      throw new Error('Quiz name is required');
    }

    const quizId = `quiz:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`;
    const quiz: Quiz = {
      id: quizId,
      name,
      description: description || '',
      team: team || 'general',
      questionIds: [],
      createdBy,
      createdAt: new Date().toISOString(),
      timeLimit: timeLimit || 30
    };

    const quizzesList = await kv.get('quizzes:list');
    const quizzes = quizzesList ? JSON.parse(quizzesList) : [];
    quizzes.push(quizId);
    await kv.set('quizzes:list', JSON.stringify(quizzes));
    await kv.set(quizId, JSON.stringify(quiz));

    return quiz;
  }

  /** Lista todos os quizzes */
  async listQuizzes(): Promise<Quiz[]> {
    const quizzesList = await kv.get('quizzes:list');
    if (!quizzesList) return [];

    const quizIds: string[] = JSON.parse(quizzesList);
    const quizzes = await kv.mget(quizIds);

    return quizzes
      .filter(Boolean)
      .map((q) => JSON.parse(q as string));
  }

  /** Deleta um quiz específico e suas perguntas */
  async deleteQuiz(quizId: string): Promise<void> {
    const quizStr = await kv.get(quizId);
    if (!quizStr) throw new Error('Quiz not found');
    
    const quiz: Quiz = JSON.parse(quizStr);
    
    if (quiz.questionIds && quiz.questionIds.length > 0) {
      for (const questionId of quiz.questionIds) {
        await kv.del(questionId);
        
        const questionsList = await kv.get('questions:list');
        if (questionsList) {
          const questions = JSON.parse(questionsList) as string[];
          const filtered = questions.filter(id => id !== questionId);
          await kv.set('questions:list', JSON.stringify(filtered));
        }
      }
    }
    
    const quizzesList = await kv.get('quizzes:list');
    if (quizzesList) {
      const quizzes = JSON.parse(quizzesList) as string[];
      const filtered = quizzes.filter(id => id !== quizId);
      await kv.set('quizzes:list', JSON.stringify(filtered));
    }
    
    await kv.del(quizId);
    
    const sessionsList = await kv.get('sessions:list');
    if (sessionsList) {
      const sessions = JSON.parse(sessionsList) as string[];
      for (const sessionId of sessions) {
        const sessionStr = await kv.get(sessionId);
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.quizId === quizId) {
            await kv.del(sessionId);
            const filtered = sessions.filter(id => id !== sessionId);
            await kv.set('sessions:list', JSON.stringify(filtered));
          }
        }
      }
    }
  }

  /** Deleta todos os quizzes e limpa o ranking */
  async deleteAllQuizzes(): Promise<void> {
    const quizzesList = await kv.get('quizzes:list');
    if (!quizzesList) return;
    
    const quizIds: string[] = JSON.parse(quizzesList);
    
    for (const quizId of quizIds) {
      await this.deleteQuiz(quizId);
    }
    
    await kv.set('quizzes:list', JSON.stringify([]));
    
    await kv.set('questions:list', JSON.stringify([]));
    
    await kv.set('sessions:list', JSON.stringify([]));
  }

  async getQuiz(quizId: string): Promise<Quiz | null> {
    const quizStr = await kv.get(quizId);
    if (!quizStr) {
      return null;
    }
    return JSON.parse(quizStr);
  }

  private async getQuizOrThrow(quizId: string): Promise<Quiz> {
    const quizStr = await kv.get(quizId);
    if (!quizStr) {
      throw new Error('Quiz not found');
    }
    return JSON.parse(quizStr);
  }

  /**
   * Cria uma nova pergunta no sistema
   * REQ 04 - Cadastrar Pergunta
   */
  async createQuestion(
    question: string,
    options: string[],
    correctAnswer: string,
    team: string,
    createdBy: string,
    quizId: string
  ): Promise<Question> {
    if (!question || !options || !correctAnswer || options.length !== 4) {
      throw new Error('Invalid question data');
    }

    if (!options.includes(correctAnswer)) {
      throw new Error('Correct answer must be one of the options');
    }

    if (!quizId) {
      throw new Error('Quiz is required to create question');
    }

    const quiz = await this.getQuizOrThrow(quizId);

    const questionId = `question:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const questionData: Question = {
      id: questionId,
      question,
      options,
      correctAnswer,
      team: team || 'general',
      createdBy,
      createdAt: new Date().toISOString()
    };

    await kv.set(questionId, JSON.stringify(questionData));

    // Anexa a pergunta ao quiz
    quiz.questionIds.push(questionId);
    await kv.set(quizId, JSON.stringify(quiz));

    return questionData;
  }

  /**
   * Lista todas as perguntas do sistema
   */
  async listQuestions(quizId?: string): Promise<Question[]> {
    if (quizId) {
      const quiz = await this.getQuizOrThrow(quizId);
      if (!quiz.questionIds.length) return [];
      const questions = await kv.mget(quiz.questionIds);
      return questions
        .filter(Boolean)
        .map((q) => JSON.parse(q as string));
    }

    const quizzes = await this.listQuizzes();
    const allQuestionIds = quizzes.flatMap((q) => q.questionIds);
    if (!allQuestionIds.length) return [];
    const questions = await kv.mget(allQuestionIds);
    return questions
      .filter(Boolean)
      .map((q) => JSON.parse(q as string));
  }

  /**
   * Busca perguntas por time/categoria
   */
  async getQuestionsByTeam(team?: string, quizId?: string): Promise<Question[]> {
    const allQuestions = await this.listQuestions(quizId);
    
    if (!team) {
      return allQuestions;
    }

    return allQuestions.filter(q => q.team === team || q.team === 'general');
  }

  /**
   * Deleta uma pergunta
   */
  async deleteQuestion(questionId: string): Promise<void> {
    // Remove de todos os quizzes
    const quizzes = await this.listQuizzes();
    for (const quiz of quizzes) {
      if (quiz.questionIds.includes(questionId)) {
        quiz.questionIds = quiz.questionIds.filter((id) => id !== questionId);
        await kv.set(quiz.id, JSON.stringify(quiz));
      }
    }

    await kv.del(questionId);
  }

  /**
   * Conta total de perguntas
   */
  async countQuestions(): Promise<number> {
    const questionsList = await kv.get('questions:list');
    if (!questionsList) {
      return 0;
    }
    const questions = JSON.parse(questionsList);
    return questions.length;
  }

  // ==========================
  // Notificações (REQ 17)
  // ==========================
  async broadcastNotification(payload: Omit<Notification, 'id' | 'createdAt' | 'message'> & { message: string }): Promise<void> {
    // Usa prefixo notifications:{userId}
    const allUsers = await kv.getByPrefix('user_profile:');
    const now = new Date().toISOString();
    const notificationsByUser = allUsers.map((profileStr: string) => {
      const profile = JSON.parse(profileStr);
      const notification: Notification = {
        id: `notif:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        createdAt: now
      };
      return { key: `notifications:${profile.id}`, notification };
    });

    for (const item of notificationsByUser) {
      const list = await kv.get(item.key);
      const arr = list ? JSON.parse(list) : [];
      arr.unshift(item.notification);
      await kv.set(item.key, JSON.stringify(arr.slice(0, 50)));
    }
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    const list = await kv.get(`notifications:${userId}`);
    return list ? JSON.parse(list) : [];
  }
}
