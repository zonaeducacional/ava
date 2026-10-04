# Mini Moodle - Ambiente Virtual de Aprendizagem (LMS)

> **AVISO IMPORTANTE DE SEGURANÇA:**
> O armazenamento de senhas em texto puro no `localStorage` e a verificação de autorização exclusivamente no front-end são adotados **apenas para fins de demonstração e prototipagem rápida**. Em um ambiente de produção real, implemente autenticação segura com JWT/OAuth, criptografia de senhas (bcrypt/argon2) e controle estrito de permissões e segurança no backend/banco de dados.

O **Mini Moodle** é um LMS (Learning Management System) simplificado e moderno desenvolvido em **React 18 + Vite** com navegação via **React Router DOM v6** e estilização em **CSS puro com variáveis**, suportando temas claro e escuro.

---

## 🚀 Como Executar o Projeto

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Abra o navegador no endereço informado no terminal (geralmente `http://localhost:3000`).

---

## 👥 Perfis de Acesso e Contas de Demonstração

O sistema já vem pré-configurado com 3 contas de teste (senha padrão: `123456`):

| Perfil | E-mail | Senha | Principais Funcionalidades |
| :--- | :--- | :--- | :--- |
| **Aluno** | `aluno@escola.com` | `123456` | Matricula-se com código, estuda conteúdos, marca itens concluídos, envia tarefas, realiza quizzes com nota automática e consulta boletim pessoal. |
| **Professor** | `prof@escola.com` | `123456` | Cria cursos (código automático), organiza seções e itens, publica avisos no mural, avalia tarefas com notas (0 a 10) e feedback, edita questões de quizzes e exporta o boletim da turma em CSV (UTF-8 BOM). |
| **Administrador** | `admin@escola.com` | `123456` | Visualiza todos os cursos da instituição e gerencia os perfis de acesso de todos os usuários cadastrados. |

---

## 📁 Estrutura de Pastas e Arquitetos

```text
├── index.html                  # Ponto de entrada HTML com fontes e tags meta
├── package.json                # Dependências e scripts
├── vite.config.ts              # Configurações do Vite
├── README.md                   # Documentação do projeto
└── src/
    ├── main.jsx                # Ponto de entrada React com ReactDOM
    ├── App.jsx                 # Configuração de rotas públicas e protegidas
    ├── styles.css              # Estilos em CSS puro com variáveis e tema escuro
    ├── lib/
    │   └── db.js               # Banco de dados local em localStorage com seed inicial
    ├── services/
    │   └── index.js            # Camada de serviços assíncronos (desacoplada da UI)
    ├── context/
    │   └── AuthContext.jsx     # Contexto de autenticação, sessão e papéis
    ├── components/
    │   ├── Layout.jsx          # Barra superior, navegação e perfil
    │   └── ProtectedRoute.jsx  # Proteção de rotas e verificação de perfil
    └── pages/
        ├── Login.jsx           # Login, cadastro e atalhos rápidos demo
        ├── Dashboard.jsx       # Painel customizado por perfil (Aluno, Prof, Admin)
        ├── Courses.jsx         # Catálogo de cursos, criação e matrícula com código
        ├── CourseDetail.jsx    # Módulos, itens, leitura, mural de avisos e progresso
        ├── AssignmentPage.jsx  # Envio de tarefas pelo aluno e correção do professor
        ├── QuizPage.jsx        # Quiz com correção automática e editor de questões
        ├── Grades.jsx          # Boletim do aluno e matriz da turma com exportação CSV
        └── AdminUsers.jsx      # Gerenciamento e troca de perfis de usuários
```

---

## 🗄️ Modelo de Dados (localStorage)

O banco de dados em `src/lib/db.js` utiliza coleções relacionais:

- **users**: `id`, `name`, `email`, `password`, `role` (`aluno` | `professor` | `admin`), `createdAt`
- **courses**: `id`, `code`, `title`, `description`, `teacherId`, `teacherName`, `createdAt`
- **sections**: `id`, `courseId`, `title`, `order`
- **items**: `id`, `sectionId`, `courseId`, `title`, `type` (`page` | `link` | `assignment` | `quiz`), `content`, `assignmentId`, `quizId`, `order`
- **assignments**: `id`, `courseId`, `itemId`, `title`, `description`, `dueDate`, `maxScore`
- **submissions**: `id`, `assignmentId`, `studentId`, `studentName`, `content`, `submittedAt`, `score`, `feedback`, `gradedAt`, `gradedBy`
- **quizzes**: `id`, `courseId`, `itemId`, `title`, `description`, `maxAttempts`, `questions` (array com `options` e marcação de `isCorrect`)
- **quiz_attempts**: `id`, `quizId`, `studentId`, `studentName`, `answers`, `score`, `maxScore`, `percentage`, `attemptedAt`
- **enrollments**: `id`, `courseId`, `studentId`, `enrolledAt`, `completedItemIds` (array)
- **announcements**: `id`, `courseId`, `title`, `content`, `authorName`, `authorRole`, `createdAt`

---

## 🔮 Próximos Passos (Evolução)

1. **Substituição do `db.js` por Backend Real:**
   Como toda a interface consome exclusivamente a camada `src/services/index.js`, a substituição por Supabase, Appwrite, Firebase ou uma API REST/GraphQL em Node.js ou NestJS pode ser feita apenas alterando as funções do serviço, sem mexer em nenhuma tela React.
2. **Upload Real de Arquivos:**
   Adicionar suporte a envio de arquivos em anexo (PDF, ZIP, imagens) para tarefas com armazenamento em bucket S3 ou Cloud Storage.
3. **Fórum de Discussões com Tópicos:**
   Expandir o mural de avisos para fóruns interativos por seção de aula.
4. **Relatórios Gráficos:**
   Adicionar gráficos visuais de retenção e média da turma utilizando SVG ou bibliotecas leves de visualização.
