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
      avatar: 'avatar-student-1',
      bio: 'Estudante entusiasta de desenvolvimento de interfaces modernas com React e JavaScript.',
      institution: 'Universidade Tecnológica',
      course: 'Engenharia de Software',
      customStatus: 'Focado nos estudos de React',
      createdAt: '2026-03-01T10:00:00.000Z'
    },
    {
      id: 'usr-student-2',
      name: 'Beatriz Mendes',
      email: 'beatriz@escola.com',
      password: '123456',
      role: 'aluno',
      avatar: 'avatar-student-3',
      bio: 'Aluna dedicada, com foco em arquitetura frontend, TypeScript e testes automatizados.',
      institution: 'Universidade Tecnológica',
      course: 'Engenharia de Software',
      customStatus: 'Concluindo módulos com dedicação',
      createdAt: '2026-03-01T10:15:00.000Z'
    },
    {
      id: 'usr-student-3',
      name: 'Rodrigo Santos',
      email: 'rodrigo@escola.com',
      password: '123456',
      role: 'aluno',
      avatar: 'avatar-student-2',
      bio: 'Estudante de Sistemas de Informação, explorando React Native e APIs REST.',
      institution: 'Universidade Tecnológica',
      course: 'Sistemas de Informação',
      customStatus: 'Revisando exercícios de código',
      createdAt: '2026-03-01T11:00:00.000Z'
    },
    {
      id: 'usr-student-4',
      name: 'Camila Ferreira',
      email: 'camila@escola.com',
      password: '123456',
      role: 'aluno',
      avatar: 'avatar-student-4',
      bio: 'Estudante de Ciência da Computação, apaixonada por TypeScript e algoritmos.',
      institution: 'Universidade Tecnológica',
      course: 'Ciência da Computação',
      customStatus: 'Atenta aos prazos das provas',
      createdAt: '2026-03-01T11:30:00.000Z'
    },
    {
      id: 'usr-teacher-1',
      name: 'Profª. Maria Silva',
      email: 'prof@escola.com',
      password: '123456',
      role: 'professor',
      avatar: 'avatar-prof-2',
      bio: 'Doutora em Ciência da Computação, pesquisadora e docente nas disciplinas de Desenvolvimento Web.',
      institution: 'Universidade Tecnológica',
      course: 'Depto. de Ciência da Computação',
      customStatus: 'Disponível para orientações no fórum',
      createdAt: '2026-03-01T09:00:00.000Z'
    },
    {
      id: 'usr-admin-1',
      name: 'Carlos Administrador',
      email: 'admin@escola.com',
      password: '123456',
      role: 'admin',
      avatar: 'avatar-minimal-graduate',
      bio: 'Administrador geral da plataforma acadêmica e gestão de usuários.',
      institution: 'Reitoria Universitária',
      course: 'Administração Escolar',
      customStatus: 'Sistema operacional e ativo',
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
    },
    {
      id: 'course-2',
      code: 'TS201',
      title: 'TypeScript Avançado e Arquitetura de Software',
      description: 'Tipagem estática, interfaces, generics e patterns modernos para construção de aplicações web robustas.',
      teacherId: 'usr-teacher-1',
      teacherName: 'Profª. Maria Silva',
      createdAt: '2026-03-02T11:00:00.000Z'
    }
  ],
  sections: [
    {
      id: 'sec-1',
      courseId: 'course-1',
      title: 'Módulo 1: Introdução ao Ecossistema React',
      order: 1
    },
    {
      id: 'sec-2',
      courseId: 'course-2',
      title: 'Módulo 1: Tipagem Estática e Generics em Escala',
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
    },
    {
      id: 'item-5',
      sectionId: 'sec-1',
      courseId: 'course-1',
      title: 'Tarefa Prática 2: Gerenciamento Global com Context API',
      type: 'assignment',
      assignmentId: 'assign-2',
      order: 5
    },
    {
      id: 'item-6',
      sectionId: 'sec-1',
      courseId: 'course-1',
      title: 'Prova Bimestral 1: Arquitetura de Componentes e Hooks',
      type: 'quiz',
      quizId: 'quiz-2',
      order: 6
    },
    {
      id: 'item-ts-1',
      sectionId: 'sec-2',
      courseId: 'course-2',
      title: 'Ementa e Guia de Instalação do TypeScript',
      type: 'page',
      content: 'Princípios da tipagem estática e configuração de tsconfig.json para projetos modernos.',
      order: 1
    },
    {
      id: 'item-ts-2',
      sectionId: 'sec-2',
      courseId: 'course-2',
      title: 'Tarefa Prática 1: Refatoração de Código JS para TypeScript',
      type: 'assignment',
      assignmentId: 'assign-ts-1',
      order: 2
    },
    {
      id: 'item-ts-3',
      sectionId: 'sec-2',
      courseId: 'course-2',
      title: 'Prova Oficial 1: Tipagem Estática e Generics',
      type: 'quiz',
      quizId: 'quiz-ts-1',
      order: 3
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
    },
    {
      id: 'assign-2',
      courseId: 'course-1',
      itemId: 'item-5',
      title: 'Tarefa Prática 2: Gerenciamento Global com Context API',
      description: 'Implemente um carrinho de compras ou tema claro/escuro utilizando createContext e useContext sem prop drilling.',
      dueDate: '2026-10-24T23:59:59.000Z',
      maxScore: 10
    },
    {
      id: 'assign-ts-1',
      courseId: 'course-2',
      itemId: 'item-ts-2',
      title: 'Tarefa Prática 1: Refatoração de Código JS para TypeScript',
      description: 'Converta um módulo utilitário em JavaScript puro para TypeScript estrito, garantindo type safety completa e generics.',
      dueDate: '2026-10-18T23:59:59.000Z',
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
    },
    {
      id: 'sub-2',
      assignmentId: 'assign-1',
      studentId: 'usr-student-2',
      studentName: 'Beatriz Mendes',
      content: 'Desenvolvi um mini gerenciador de tarefas (Todo List) com useState e useEffect para persistência local.\nComponente estruturado modularmente com subcomponentes de item e formulário.',
      submittedAt: '2026-10-08T08:30:00.000Z',
      score: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null
    },
    {
      id: 'sub-3',
      assignmentId: 'assign-1',
      studentId: 'usr-student-3',
      studentName: 'Rodrigo Santos',
      content: 'Criei o componente de cronômetro com start, pause e reset utilizando hooks funcionais. Estou com dúvida sobre a precisão do intervalo.',
      submittedAt: '2026-10-03T16:45:00.000Z',
      score: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null
    },
    {
      id: 'sub-4',
      assignmentId: 'assign-ts-1',
      studentId: 'usr-student-1',
      studentName: 'Lucas Aluno',
      content: 'Refatorei as funções utilitárias de formatação e requisições para TypeScript, adicionando interfaces estritas e tipos genéricos para as respostas da API.',
      submittedAt: '2026-10-07T11:20:00.000Z',
      score: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null
    },
    {
      id: 'sub-5',
      assignmentId: 'assign-ts-1',
      studentId: 'usr-student-2',
      studentName: 'Beatriz Mendes',
      content: 'Conversão concluída com 100% de cobertura de tipos, sem uso de `any`, utilizando discriminated unions e narrowing.',
      submittedAt: '2026-10-06T15:00:00.000Z',
      score: 8.8,
      feedback: 'Ótima estruturação dos tipos e uso exemplar de generics! Atenção apenas à tipagem de erros do catch.',
      gradedAt: '2026-10-07T10:00:00.000Z',
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
      dueDate: '2026-10-20T23:59:59.000Z',
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
    },
    {
      id: 'quiz-2',
      courseId: 'course-1',
      itemId: 'item-6',
      title: 'Prova Bimestral 1: Arquitetura de Componentes e Hooks',
      description: 'Avaliação formal com ênfase em ciclo de vida de componentes, renderização condicional e boas práticas de estado.',
      dueDate: '2026-10-29T20:00:00.000Z',
      maxAttempts: 2,
      questions: [
        {
          id: 'q-3',
          text: 'Quando o efeito em um useEffect com array de dependências vazio [] é executado?',
          points: 10,
          options: [
            { id: 'opt-9', text: 'Apenas uma vez, após a montagem inicial do componente', isCorrect: true },
            { id: 'opt-10', text: 'A cada atualização de qualquer estado', isCorrect: false },
            { id: 'opt-11', text: 'Apenas quando o componente for desmontado', isCorrect: false }
          ]
        }
      ]
    },
    {
      id: 'quiz-ts-1',
      courseId: 'course-2',
      itemId: 'item-ts-3',
      title: 'Prova Oficial 1: Tipagem Estática e Generics',
      description: 'Avaliação teórica e prática cobrindo união de tipos, type guards, interfaces e generics.',
      dueDate: '2026-10-27T19:30:00.000Z',
      maxAttempts: 2,
      questions: [
        {
          id: 'q-ts-1',
          text: 'Qual palavra-chave em TypeScript permite definir tipos flexíveis e reutilizáveis parametrizando tipos?',
          points: 10,
          options: [
            { id: 'opt-t1', text: 'Generics (<T>)', isCorrect: true },
            { id: 'opt-t2', text: 'any', isCorrect: false },
            { id: 'opt-t3', text: 'unknown', isCorrect: false }
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
    },
    {
      id: 'enr-2',
      courseId: 'course-2',
      studentId: 'usr-student-1',
      enrolledAt: '2026-03-04T09:00:00.000Z',
      completedItemIds: ['item-ts-1']
    },
    {
      id: 'enr-3',
      courseId: 'course-1',
      studentId: 'usr-student-2',
      enrolledAt: '2026-03-03T14:20:00.000Z',
      completedItemIds: ['item-1', 'item-2']
    },
    {
      id: 'enr-4',
      courseId: 'course-2',
      studentId: 'usr-student-2',
      enrolledAt: '2026-03-04T10:00:00.000Z',
      completedItemIds: ['item-ts-1']
    },
    {
      id: 'enr-5',
      courseId: 'course-1',
      studentId: 'usr-student-3',
      enrolledAt: '2026-03-03T16:00:00.000Z',
      completedItemIds: ['item-1']
    },
    {
      id: 'enr-6',
      courseId: 'course-2',
      studentId: 'usr-student-4',
      enrolledAt: '2026-03-04T11:30:00.000Z',
      completedItemIds: []
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
  ],
  forum_topics: [
    {
      id: 'topic-1',
      courseId: 'course-1',
      sectionId: 'sec-1',
      sectionTitle: 'Módulo 1: Fundamentos do React e JSX',
      title: 'Como lidar com dependências e evitar loops no useEffect?',
      content: 'Olá professora e colegas! Estou com uma dúvida ao utilizar o useEffect para carregar dados de uma API. Quando passo um array de dependências vazio ele roda apenas uma vez, mas se eu precisar atualizar o dado quando uma variável mudar, o ESLint avisa que faltam dependências. Qual é o padrão recomendado para lidar com isso sem gerar re-renderizações infinitas?',
      authorId: 'usr-student-1',
      authorName: 'Lucas Aluno',
      authorRole: 'aluno',
      status: 'answered', // 'pending' | 'answered'
      tags: ['Hooks', 'useEffect', 'Dúvida Teórica'],
      createdAt: '2026-10-06T14:20:00.000Z',
      updatedAt: '2026-10-06T16:45:00.000Z',
      views: 28,
      repliesCount: 2,
      isPinned: false
    },
    {
      id: 'topic-2',
      courseId: 'course-1',
      sectionId: 'sec-2',
      sectionTitle: 'Módulo 2: Gerenciamento de Estado e Ciclo de Vida',
      title: 'Dúvida na Tarefa Prática 1: manipulação de múltiplos contadores e histórico',
      content: 'Boa tarde! Na Tarefa Prática 1, o contador deve manter o histórico de cada clique em um array ou apenas exibir o valor numérico corrente? Tentei criar um array de histórico de operações mas fiquei em dúvida se isso era solicitado estritamente nos critérios de correção.',
      authorId: 'usr-student-1',
      authorName: 'Lucas Aluno',
      authorRole: 'aluno',
      status: 'pending', // 'pending' aguardando resposta do professor
      tags: ['Tarefa Prática', 'useState', 'Critérios'],
      createdAt: '2026-10-08T08:15:00.000Z',
      updatedAt: '2026-10-08T08:15:00.000Z',
      views: 12,
      repliesCount: 0,
      isPinned: false
    },
    {
      id: 'topic-3',
      courseId: 'course-1',
      sectionId: null,
      sectionTitle: 'Geral do Curso',
      title: 'Recomendação de materiais e artigos sobre boas práticas com TypeScript e React',
      content: 'Professora Maria, você teria recomendações de livros, artigos ou documentações recomendadas para aprofundar na tipagem estrita de props genéricas e eventos no React 18?',
      authorId: 'usr-student-1',
      authorName: 'Lucas Aluno',
      authorRole: 'aluno',
      status: 'answered',
      tags: ['TypeScript', 'Material Complementar'],
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T11:30:00.000Z',
      views: 34,
      repliesCount: 1,
      isPinned: true
    }
  ],
  forum_replies: [
    {
      id: 'reply-1',
      topicId: 'topic-1',
      authorId: 'usr-teacher-1',
      authorName: 'Profª. Maria Silva',
      authorRole: 'professor',
      content: 'Excelente pergunta, Lucas! Quando uma variável de estado ou função é consumida dentro do effect, o padrão do React exige que ela esteja na lista de dependências. Para evitar loops infinitos:\n\n1. Use a forma funcional do setter: `setCount(prev => prev + 1)` em vez de `setCount(count + 1)`. Dessa forma, o `count` não precisa estar nas dependências!\n2. Se chamar uma função externa, envolva-a em `useCallback` com suas próprias dependências.\n3. Funções puras que não usam props nem estado podem ser movidas para fora do componente.\n\nFaremos uma demonstração prática desse caso na nossa próxima aula ao vivo!',
      isTeacherAnswer: true,
      createdAt: '2026-10-06T16:45:00.000Z',
      upvotes: 4
    },
    {
      id: 'reply-2',
      topicId: 'topic-1',
      authorId: 'usr-student-1',
      authorName: 'Lucas Aluno',
      authorRole: 'aluno',
      content: 'Perfeito, professora! Testei com o callback funcional `prev => prev + 1` e o warning do ESLint sumiu imediatamente sem re-executar o effect em loop. Muito obrigado pela explicação clara!',
      isTeacherAnswer: false,
      createdAt: '2026-10-06T17:10:00.000Z',
      upvotes: 1
    },
    {
      id: 'reply-3',
      topicId: 'topic-3',
      authorId: 'usr-teacher-1',
      authorName: 'Profª. Maria Silva',
      authorRole: 'professor',
      content: 'Olá Lucas! Recomendo com certeza a documentação oficial moderna (react.dev) e o guia comunitário "React TypeScript Cheatsheet" (react-typescript-cheatsheet.netlify.app). Além disso, disponibilizei um laboratório interativo na nossa aba de Atividades Externas!',
      isTeacherAnswer: true,
      createdAt: '2026-10-04T11:30:00.000Z',
      upvotes: 3
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
        // Garante sincronização de novos cursos e dados do seed
        let courses = parsed.courses || [];
        let sections = parsed.sections || [];
        let items = parsed.items || [];
        let assignments = parsed.assignments || [];
        let quizzes = parsed.quizzes || [];
        let enrollments = parsed.enrollments || [];

        // Adiciona cursos do seed que não existam
        initialSeed.courses.forEach((c) => {
          if (!courses.some((existing) => existing.id === c.id)) {
            courses.push(c);
          }
        });

        // Adiciona seções do seed que não existam
        initialSeed.sections.forEach((s) => {
          if (!sections.some((existing) => existing.id === s.id)) {
            sections.push(s);
          }
        });

        // Adiciona itens do seed que não existam
        initialSeed.items.forEach((it) => {
          if (!items.some((existing) => existing.id === it.id)) {
            items.push(it);
          }
        });

        // Adiciona assignments do seed que não existam
        initialSeed.assignments.forEach((a) => {
          if (!assignments.some((existing) => existing.id === a.id)) {
            assignments.push(a);
          }
        });

        // Adiciona quizzes do seed que não existam
        initialSeed.quizzes.forEach((q) => {
          if (!quizzes.some((existing) => existing.id === q.id)) {
            quizzes.push(q);
          }
        });

        // Adiciona matrículas do seed que não existam
        initialSeed.enrollments.forEach((e) => {
          if (!enrollments.some((existing) => existing.courseId === e.courseId && existing.studentId === e.studentId)) {
            enrollments.push(e);
          }
        });

        // Garante prazos de entrega em quizzes e tarefas existentes
        quizzes = quizzes.map((q, idx) => {
          if (!q.dueDate) {
            const seedQ = initialSeed.quizzes.find((sq) => sq.id === q.id);
            return {
              ...q,
              dueDate: seedQ?.dueDate || (idx % 2 === 0 ? '2026-10-20T23:59:59.000Z' : '2026-10-29T20:00:00.000Z')
            };
          }
          return q;
        });

        assignments = assignments.map((a, idx) => {
          if (!a.dueDate) {
            const seedA = initialSeed.assignments.find((sa) => sa.id === a.id);
            return {
              ...a,
              dueDate: seedA?.dueDate || (idx % 2 === 0 ? '2026-10-15T23:59:59.000Z' : '2026-10-24T23:59:59.000Z')
            };
          }
          return a;
        });

        let users = parsed.users || [];
        initialSeed.users.forEach((u) => {
          if (!users.some((existing) => existing.id === u.id)) {
            users.push(u);
          }
        });

        users = users.map((u) => {
          if (!u.avatar) {
            const seedU = initialSeed.users.find((su) => su.id === u.id);
            return {
              ...u,
              avatar: seedU?.avatar || (u.role === 'professor' ? 'avatar-prof-2' : 'avatar-student-1')
            };
          }
          return u;
        });

        let submissions = parsed.submissions || [];
        initialSeed.submissions.forEach((s) => {
          if (!submissions.some((existing) => existing.id === s.id)) {
            submissions.push(s);
          }
        });

        // Garante que todas as coleções existam
        return {
          users,
          courses,
          sections,
          items,
          assignments,
          submissions,
          quizzes,
          quiz_attempts: parsed.quiz_attempts || [],
          enrollments,
          announcements: parsed.announcements || [],
          live_sessions: parsed.live_sessions || [],
          course_texts: parsed.course_texts && parsed.course_texts.length > 0 ? parsed.course_texts : initialSeed.course_texts,
          text_comments: parsed.text_comments && parsed.text_comments.length > 0 ? parsed.text_comments : initialSeed.text_comments,
          external_activities: parsed.external_activities && parsed.external_activities.length > 0 ? parsed.external_activities : initialSeed.external_activities,
          forum_topics: parsed.forum_topics && parsed.forum_topics.length > 0 ? parsed.forum_topics : initialSeed.forum_topics,
          forum_replies: parsed.forum_replies && parsed.forum_replies.length > 0 ? parsed.forum_replies : initialSeed.forum_replies
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

  findById(collection, id) {
    return this.find(collection, id);
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

  create(collection, item) {
    return this.insert(collection, item);
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

  delete(collection, id) {
    return this.remove(collection, id);
  }
}

export const db = new Database();
