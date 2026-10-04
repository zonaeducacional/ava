/**
 * ATENÇÃO: ARMAZENAMENTO LOCAL PARA FINS DE DEMONSTRAÇÃO
 * O armazenamento de senhas em texto puro e a checagem de autorização
 * exclusivamente no front-end são apenas para demonstração e prototipagem.
 * Em um ambiente de produção real, utilize autenticação segura baseada em servidor
 * (JWT/OAuth), hash com bcrypt/argon2 e controle de acesso estrito no backend/banco de dados.
 */

const STORAGE_KEY = 'mini_moodle_database_v1';

// Dados iniciais (Seed)
const initialSeed = {
  users: [
    {
      id: 'usr-student-1',
      name: 'Lucas Aluno',
      email: 'aluno@escola.com',
      password: '123456',
      role: 'aluno',
      createdAt: '2026-03-01T10:00:00.000Z'
    },
    {
      id: 'usr-teacher-1',
      name: 'Profª. Maria Silva',
      email: 'prof@escola.com',
      password: '123456',
      role: 'professor',
      createdAt: '2026-03-01T09:00:00.000Z'
    },
    {
      id: 'usr-admin-1',
      name: 'Carlos Administrador',
      email: 'admin@escola.com',
      password: '123456',
      role: 'admin',
      createdAt: '2026-03-01T08:00:00.000Z'
    }
  ],
  courses: [
    {
      id: 'course-1',
      code: 'REACT101',
      title: 'Desenvolvimento Web com React e JavaScript Moderno',
      description: 'Aprenda os fundamentos de componentes, hooks, estado e rotas no React 18 para criar aplicações ricas e reativas.',
      teacherId: 'usr-teacher-1',
      teacherName: 'Profª. Maria Silva',
      createdAt: '2026-03-02T10:00:00.000Z'
    }
  ],
  sections: [
    {
      id: 'sec-1',
      courseId: 'course-1',
      title: 'Módulo 1: Introdução ao Ecossistema React',
      order: 1
    }
  ],
  items: [
    {
      id: 'item-1',
      sectionId: 'sec-1',
      courseId: 'course-1',
      title: 'Guia de Boas-Vindas e Ementa do Curso',
      type: 'page',
      content: 'Bem-vindo ao curso de Desenvolvimento Web com React!\n\nNeste curso prático, você aprenderá:\n1. Estruturação moderna de projetos com Vite;\n2. Ciclo de vida e hooks essenciais (useState, useEffect, useContext);\n3. Roteamento com React Router Dom v6;\n4. Gerenciamento de formulários, validações e boas práticas de acessibilidade.\n\nBons estudos e conte com o fórum de avisos para tirar dúvidas!',
      order: 1
    },
    {
      id: 'item-2',
      sectionId: 'sec-1',
      courseId: 'course-1',
      title: 'Documentação Oficial do React (React.dev)',
      type: 'link',
      content: 'https://react.dev/learn',
      order: 2
    },
    {
      id: 'item-3',
      sectionId: 'sec-1',
      courseId: 'course-1',
      title: 'Tarefa Prática 1: Criação de Componente com Estado',
      type: 'assignment',
      assignmentId: 'assign-1',
      order: 3
    },
    {
      id: 'item-4',
      sectionId: 'sec-1',
      courseId: 'course-1',
      title: 'Quiz de Fixação: Fundamentos do React',
      type: 'quiz',
      quizId: 'quiz-1',
      order: 4
    }
  ],
  assignments: [
    {
      id: 'assign-1',
      courseId: 'course-1',
      itemId: 'item-3',
      title: 'Tarefa Prática 1: Criação de Componente com Estado',
      description: 'Desenvolva um componente de contador ou lista de tarefas em React utilizando o hook useState. Descreva em seu texto de entrega como você estruturou os componentes, como manipulou os eventos e cole o trecho principal do seu código JSX.',
      dueDate: '2026-10-15T23:59:59.000Z',
      maxScore: 10
    }
  ],
  submissions: [
    {
      id: 'sub-1',
      assignmentId: 'assign-1',
      studentId: 'usr-student-1',
      studentName: 'Lucas Aluno',
      content: 'Implementei o contador com botões de incremento, decremento e reset. Código:\n\nfunction Contador() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Valor: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Somar</button>\n    </div>\n  );\n}',
      submittedAt: '2026-03-05T14:30:00.000Z',
      score: 9.5,
      feedback: 'Excelente trabalho, Lucas! O estado foi manipulado corretamente e o componente está limpo e legível.',
      gradedAt: '2026-03-06T09:15:00.000Z',
      gradedBy: 'Profª. Maria Silva'
    }
  ],
  quizzes: [
    {
      id: 'quiz-1',
      courseId: 'course-1',
      itemId: 'item-4',
      title: 'Quiz de Fixação: Fundamentos do React',
      description: 'Teste seus conhecimentos sobre Virtual DOM, JSX e Hooks essenciais do React. Nota máxima 10,0.',
      maxAttempts: 3,
      questions: [
        {
          id: 'q-1',
          text: 'Qual hook do React é utilizado primordialmente para gerenciar estado local em componentes funcionais?',
          points: 5,
          options: [
            { id: 'opt-1', text: 'useEffect', isCorrect: false },
            { id: 'opt-2', text: 'useState', isCorrect: true },
            { id: 'opt-3', text: 'useRef', isCorrect: false },
            { id: 'opt-4', text: 'useHistory', isCorrect: false }
          ]
        },
        {
          id: 'q-2',
          text: 'O que é o JSX no contexto do ecossistema React?',
          points: 5,
          options: [
            { id: 'opt-5', text: 'Um pré-processador CSS avançado para navegadores', isCorrect: false },
            { id: 'opt-6', text: 'Uma extensão de sintaxe para JavaScript que se assemelha a XML/HTML', isCorrect: true },
            { id: 'opt-7', text: 'Um banco de dados embutido no navegador', isCorrect: false },
            { id: 'opt-8', text: 'Um protocolo de comunicação web em tempo real', isCorrect: false }
          ]
        }
      ]
    }
  ],
  quiz_attempts: [
    {
      id: 'atm-1',
      quizId: 'quiz-1',
      studentId: 'usr-student-1',
      studentName: 'Lucas Aluno',
      answers: {
        'q-1': 'opt-2',
        'q-2': 'opt-6'
      },
      score: 10,
      maxScore: 10,
      percentage: 100,
      attemptedAt: '2026-03-04T16:20:00.000Z'
    }
  ],
  enrollments: [
    {
      id: 'enr-1',
      courseId: 'course-1',
      studentId: 'usr-student-1',
      enrolledAt: '2026-03-03T11:00:00.000Z',
      completedItemIds: ['item-1', 'item-2', 'item-3', 'item-4']
    }
  ],
  announcements: [
    {
      id: 'ann-1',
      courseId: 'course-1',
      title: 'Boas-vindas ao semestre 2026!',
      content: 'Olá a todos os alunos! Sejam muito bem-vindos ao curso. O cronograma já está disponível no módulo inicial. Fiquem atentos aos prazos da Tarefa 1 e aproveitem o quiz para revisar os conceitos.',
      authorName: 'Profª. Maria Silva',
      authorRole: 'professor',
      createdAt: '2026-03-02T11:30:00.000Z'
    }
  ],
  live_sessions: [],
  course_texts: [
    {
      id: 'txt-1',
      courseId: 'course-1',
      title: 'Texto Base 01: A Evolução da Arquitetura Baseada em Componentes',
      authorId: 'usr-teacher-1',
      authorName: 'Profª. Maria Silva',
      authorRole: 'professor',
      sourceType: 'text',
      fileName: 'Arquitetura_Componentes_React.pdf',
      fileSize: '240 KB',
      summary: 'Leitura obrigatória sobre os princípios da componentização no desenvolvimento moderno de interfaces e gerenciamento de estado.',
      content: `A evolução do desenvolvimento web passou por marcos determinantes na última década. Antes da popularização de bibliotecas como React, a separação tradicional de tecnologias (HTML para marcação, CSS para estilo e JavaScript para comportamento) frequentemente criava códigos dispersos e de difícil manutenção em projetos de grande escala.

Com o advento dos componentes reutilizáveis, a indústria convergiu para uma nova convenção: separar responsabilidades por "interesses funcionais" (concerns) e não meramente por extensões de arquivos. Um componente encapsula sua própria estrutura visual, sua lógica de negócio e seus estilos locais.

Principais Vantagens da Componentização:
1. Reusabilidade: Menos duplicação de código e testes mais confiáveis.
2. Manutenibilidade: Falhas ficam isoladas no escopo do componente.
3. Declaratividade: O desenvolvedor descreve "como a interface deve se parecer dado um determinado estado", deixando a reconciliação e atualização da DOM para o Virtual DOM.
4. Ecossistema: Possibilidade de integrar design systems corporativos com consistência visual estrita.

Pergunta norteadora para o debate da turma:
Em quais cenários vocês consideram que a complexidade de gerenciar múltiplos estados entre componentes pode superar as vantagens da modularização? Deixem suas análises no chat abaixo!`,
      createdAt: '2026-03-03T14:00:00.000Z'
    }
  ],
  text_comments: [
    {
      id: 'comm-1',
      textId: 'txt-1',
      userId: 'usr-student-1',
      userName: 'Lucas Aluno',
      userRole: 'aluno',
      comment: 'Excelente reflexão, professora! Na minha experiência com projetos pequenos, quando temos estados que precisam ser passados por muitos níveis (o chamado "prop drilling"), acabo gastando mais tempo configurando contexto do que criando a interface em si.',
      createdAt: '2026-03-03T15:30:00.000Z'
    },
    {
      id: 'comm-2',
      textId: 'txt-1',
      userId: 'usr-teacher-1',
      userName: 'Profª. Maria Silva',
      userRole: 'professor',
      comment: 'Ótima colocação, Lucas! O "prop drilling" é exatamente um dos desafios mais comuns. Nas próximas aulas veremos a Context API e bibliotecas de gerenciamento de estado global que resolvem esse ponto com elegância.',
      createdAt: '2026-03-03T16:10:00.000Z'
    }
  ],
  external_activities: [
    {
      id: 'ext-act-1',
      courseId: 'course-1',
      title: 'Laboratório Prático: Playground de Componentes e Hooks no CodePen',
      description: 'Acesse o ambiente interativo do CodePen para exercitar a criação de componentes com useState e useEffect. Modifique os contadores e observe a re-renderização em tempo real.',
      url: 'https://codepen.io/pen/',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      category: 'Laboratório Prático',
      dueDate: '2026-03-25T23:59:00.000Z',
      authorId: 'usr-teacher-1',
      authorName: 'Profª. Maria Silva',
      createdAt: '2026-03-03T11:00:00.000Z'
    },
    {
      id: 'ext-act-2',
      courseId: 'course-1',
      title: 'Desafio Gamificado: Quiz Interativo de React no Kahoot',
      description: 'Teste seus conhecimentos em tempo real sobre ciclo de vida de componentes e Virtual DOM nesta rodada de perguntas rápidas preparadas para a turma.',
      url: 'https://kahoot.it/',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      category: 'Desafio & Gamificação',
      dueDate: '2026-03-28T20:00:00.000Z',
      authorId: 'usr-teacher-1',
      authorName: 'Profª. Maria Silva',
      createdAt: '2026-03-04T09:30:00.000Z'
    }
  ]
};

// Funções de baixo nível para gerenciar a persistência em memória e localStorage
class Database {
  constructor() {
    this.data = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Garante que todas as coleções existam
        return {
          users: parsed.users || [],
          courses: parsed.courses || [],
          sections: parsed.sections || [],
          items: parsed.items || [],
          assignments: parsed.assignments || [],
          submissions: parsed.submissions || [],
          quizzes: parsed.quizzes || [],
          quiz_attempts: parsed.quiz_attempts || [],
          enrollments: parsed.enrollments || [],
          announcements: parsed.announcements || [],
          live_sessions: parsed.live_sessions || [],
          course_texts: parsed.course_texts && parsed.course_texts.length > 0 ? parsed.course_texts : initialSeed.course_texts,
          text_comments: parsed.text_comments && parsed.text_comments.length > 0 ? parsed.text_comments : initialSeed.text_comments,
          external_activities: parsed.external_activities && parsed.external_activities.length > 0 ? parsed.external_activities : initialSeed.external_activities
        };
      }
    } catch (err) {
      console.warn('Erro ao carregar banco do localStorage, utilizando seed:', err);
    }

    // Se não houver nada no storage, popula com o seed inicial
    this.saveToStorage(initialSeed);
    return JSON.parse(JSON.stringify(initialSeed));
  }

  saveToStorage(dataToSave) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave || this.data));
    } catch (err) {
      console.error('Erro ao salvar dados no localStorage:', err);
    }
  }

  persist() {
    this.saveToStorage(this.data);
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialSeed));
    this.persist();
    return this.data;
  }

  all(collection) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    return JSON.parse(JSON.stringify(this.data[collection]));
  }

  find(collection, id) {
    const list = this.all(collection);
    return list.find((item) => item.id === id) || null;
  }

  where(collection, predicateOrFilter) {
    const list = this.all(collection);
    if (typeof predicateOrFilter === 'function') {
      return list.filter(predicateOrFilter);
    }
    if (typeof predicateOrFilter === 'object' && predicateOrFilter !== null) {
      return list.filter((item) => {
        return Object.entries(predicateOrFilter).every(([key, val]) => item[key] === val);
      });
    }
    return list;
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const newItem = {
      ...item,
      id: item.id || `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    this.data[collection].push(newItem);
    this.persist();
    return JSON.parse(JSON.stringify(newItem));
  }

  update(collection, id, updates) {
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex((item) => item.id === id);
    if (index === -1) return null;

    this.data[collection][index] = {
      ...this.data[collection][index],
      ...updates
    };
    this.persist();
    return JSON.parse(JSON.stringify(this.data[collection][index]));
  }

  remove(collection, id) {
    if (!this.data[collection]) return false;
    const initialLen = this.data[collection].length;
    this.data[collection] = this.data[collection].filter((item) => item.id !== id);
    const removed = this.data[collection].length < initialLen;
    if (removed) {
      this.persist();
    }
    return removed;
  }
}

export const db = new Database();
