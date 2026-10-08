/**
 * Galeria de Avatares Pré-existentes para o Perfil do Usuário
 * Ilustrações vetoriais (SVG) otimizadas com a paleta oficial do sistema:
 * #fdf4b0 (.color1), #a4dcb9 (.color2), #5bcebf (.color3), #32b9be (.color4), #2e97b7 (.color5)
 */

export const AVATAR_CATEGORIES = [
  { id: 'all', label: 'Todos os Avatares' },
  { id: 'academic', label: 'Docentes & Pesquisa' },
  { id: 'student', label: 'Estudantes & Alunos' },
  { id: 'tech', label: 'Tech & Código' },
  { id: 'mascots', label: 'Mascotes do Saber' },
  { id: 'minimal', label: 'Minimalistas & Gradientes' }
];

export const PREEXISTING_AVATARS = [
  // --- DOCENTES & PESQUISA ---
  {
    id: 'avatar-prof-1',
    name: 'Prof. Newton (Física & Cálculo)',
    category: 'academic',
    categoryLabel: 'Docentes & Pesquisa',
    bgColor: '#e6f7f5',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2e97b7"/>
      <circle cx="50" cy="40" r="22" fill="#fed7aa"/>
      <path d="M28 35C28 22 38 16 50 16C62 16 72 22 72 35C72 37 68 36 65 33C60 38 40 38 35 33C32 36 28 37 28 35Z" fill="#78350f"/>
      <rect x="36" y="36" width="11" height="8" rx="2" stroke="#1e293b" stroke-width="2.5" fill="none"/>
      <rect x="53" y="36" width="11" height="8" rx="2" stroke="#1e293b" stroke-width="2.5" fill="none"/>
      <line x1="47" y1="40" x2="53" y2="40" stroke="#1e293b" stroke-width="2.5"/>
      <path d="M44 48C46 51 54 51 56 48" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M20 92C20 72 32 64 50 64C68 64 80 72 80 92V100H20V92Z" fill="#1e293b"/>
      <polygon points="50,66 44,78 56,78" fill="#5bcebf"/>
      <polygon points="50,78 46,92 50,96 54,92" fill="#fdf4b0"/>
    </svg>`
  },
  {
    id: 'avatar-prof-2',
    name: 'Profª. Hipátia (Filosofia & Dados)',
    category: 'academic',
    categoryLabel: 'Docentes & Pesquisa',
    bgColor: '#fdfbe7',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#32b9be"/>
      <circle cx="50" cy="42" r="22" fill="#ffedd5"/>
      <path d="M26 42C26 24 35 15 50 15C65 15 74 24 74 42C74 52 70 56 68 56C66 50 64 42 64 42C58 46 42 46 36 42C36 42 34 50 32 56C30 56 26 52 26 42Z" fill="#451a03"/>
      <circle cx="41" cy="40" r="2.5" fill="#451a03"/>
      <circle cx="59" cy="40" r="2.5" fill="#451a03"/>
      <path d="M45 49C48 52 52 52 55 49" stroke="#9a3412" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 94C22 74 34 65 50 65C66 65 78 74 78 94V100H22V94Z" fill="#132f38"/>
      <path d="M38 65L50 82L62 65" fill="#a4dcb9"/>
      <circle cx="50" cy="85" r="4" fill="#fdf4b0"/>
    </svg>`
  },
  {
    id: 'avatar-prof-3',
    name: 'Prof. Turing (Algoritmos)',
    category: 'academic',
    categoryLabel: 'Docentes & Pesquisa',
    bgColor: '#eefcf8',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#132f38"/>
      <circle cx="50" cy="40" r="21" fill="#fde68a"/>
      <path d="M30 32C32 20 40 16 50 16C60 16 68 20 70 32C66 30 62 30 58 28C50 32 42 32 30 32Z" fill="#334155"/>
      <circle cx="42" cy="38" r="2.5" fill="#1e293b"/>
      <circle cx="58" cy="38" r="2.5" fill="#1e293b"/>
      <rect x="34" y="32" width="15" height="12" rx="3" stroke="#5bcebf" stroke-width="2" fill="none"/>
      <rect x="51" y="32" width="15" height="12" rx="3" stroke="#5bcebf" stroke-width="2" fill="none"/>
      <line x1="49" y1="38" x2="51" y2="38" stroke="#5bcebf" stroke-width="2"/>
      <path d="M45 48C47 50 53 50 55 48" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 92C22 72 34 64 50 64C66 64 78 72 78 92V100H22V92Z" fill="#2e97b7"/>
      <path d="M42 64L50 78L58 64" fill="#fdf4b0"/>
    </svg>`
  },
  {
    id: 'avatar-prof-4',
    name: 'Dra. Marie (Ciências & Laboratório)',
    category: 'academic',
    categoryLabel: 'Docentes & Pesquisa',
    bgColor: '#fdf6c7',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#5bcebf"/>
      <circle cx="50" cy="41" r="21" fill="#ffedd5"/>
      <path d="M30 32C30 20 40 16 50 16C60 16 70 20 70 32C70 42 66 48 64 52C60 48 40 48 36 52C34 48 30 42 30 32Z" fill="#713f12"/>
      <circle cx="43" cy="39" r="2.5" fill="#451a03"/>
      <circle cx="57" cy="39" r="2.5" fill="#451a03"/>
      <path d="M44 48C47 51 53 51 56 48" stroke="#9a3412" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M22 95C22 74 34 65 50 65C66 65 78 74 78 95V100H22V95Z" fill="#ffffff"/>
      <path d="M36 65L44 85L50 65" fill="#2e97b7"/>
      <path d="M64 65L56 85L50 65" fill="#2e97b7"/>
      <circle cx="50" cy="74" r="3" fill="#32b9be"/>
    </svg>`
  },

  // --- ESTUDANTES & ALUNOS ---
  {
    id: 'avatar-student-1',
    name: 'Lucas Estudante (Front-End)',
    category: 'student',
    categoryLabel: 'Estudantes & Alunos',
    bgColor: '#eaf8f6',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#a4dcb9"/>
      <circle cx="50" cy="41" r="21" fill="#fed7aa"/>
      <path d="M28 32C30 18 42 16 50 16C58 16 70 18 72 32C72 36 68 34 64 30C58 34 42 34 36 30C32 34 28 36 28 32Z" fill="#1e293b"/>
      <circle cx="42" cy="40" r="2.5" fill="#1e293b"/>
      <circle cx="58" cy="40" r="2.5" fill="#1e293b"/>
      <path d="M44 48C47 52 53 52 56 48" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
      <!-- Fones de Ouvido -->
      <path d="M24 40C24 24 35 15 50 15C65 15 76 24 76 40" stroke="#2e97b7" stroke-width="4" stroke-linecap="round"/>
      <rect x="22" y="34" width="7" height="15" rx="3.5" fill="#132f38"/>
      <rect x="71" y="34" width="7" height="15" rx="3.5" fill="#132f38"/>
      <!-- Camiseta Estilosa -->
      <path d="M20 94C20 74 34 64 50 64C66 64 80 74 80 94V100H20V94Z" fill="#2e97b7"/>
      <circle cx="50" cy="64" r="9" fill="#fed7aa"/>
      <polygon points="50,73 45,84 55,84" fill="#fdf4b0"/>
    </svg>`
  },
  {
    id: 'avatar-student-2',
    name: 'Ana Universitária (Engenharia)',
    category: 'student',
    categoryLabel: 'Estudantes & Alunos',
    bgColor: '#fffde6',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#fdf4b0"/>
      <circle cx="50" cy="42" r="21" fill="#fcd34d"/>
      <path d="M26 36C26 20 38 14 50 14C62 14 74 20 74 36C74 54 70 58 66 58C64 52 62 44 62 44C56 46 44 46 38 44C38 44 36 52 34 58C30 58 26 54 26 36Z" fill="#92400e"/>
      <circle cx="43" cy="40" r="2.5" fill="#451a03"/>
      <circle cx="57" cy="40" r="2.5" fill="#451a03"/>
      <path d="M45 49C48 53 52 53 55 49" stroke="#b45309" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Boné para trás moderno -->
      <path d="M28 26C30 18 38 14 50 14C62 14 70 18 72 26H28Z" fill="#32b9be"/>
      <path d="M22 28C22 24 28 24 34 25L28 29C24 29 22 28 22 28Z" fill="#132f38"/>
      <!-- Casaco / Moletom -->
      <path d="M20 95C20 75 33 65 50 65C67 65 80 75 80 95V100H20V95Z" fill="#32b9be"/>
      <path d="M42 65L50 82L58 65" fill="#ffffff"/>
      <line x1="50" y1="82" x2="50" y2="100" stroke="#132f38" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'avatar-student-3',
    name: 'Mateus Estudante (Design & UI)',
    category: 'student',
    categoryLabel: 'Estudantes & Alunos',
    bgColor: '#e3f7f5',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#5bcebf"/>
      <circle cx="50" cy="42" r="21" fill="#fed7aa"/>
      <path d="M30 30C32 18 42 16 50 16C58 16 68 18 70 30C66 28 62 26 50 26C38 26 34 28 30 30Z" fill="#0f172a"/>
      <!-- Óculos redondos modernos -->
      <circle cx="41" cy="40" r="7" stroke="#132f38" stroke-width="2" fill="none"/>
      <circle cx="59" cy="40" r="7" stroke="#132f38" stroke-width="2" fill="none"/>
      <line x1="48" y1="40" x2="52" y2="40" stroke="#132f38" stroke-width="2"/>
      <circle cx="41" cy="40" r="2" fill="#132f38"/>
      <circle cx="59" cy="40" r="2" fill="#132f38"/>
      <path d="M45 49C48 52 52 52 55 49" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
      <!-- Camisa gola polo -->
      <path d="M22 95C22 75 34 65 50 65C66 65 78 75 78 95V100H22V95Z" fill="#132f38"/>
      <polygon points="50,67 42,78 58,78" fill="#a4dcb9"/>
    </svg>`
  },
  {
    id: 'avatar-student-4',
    name: 'Beatriz Leitora (Pedagogia)',
    category: 'student',
    categoryLabel: 'Estudantes & Alunos',
    bgColor: '#edfbf7',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2e97b7"/>
      <circle cx="50" cy="43" r="21" fill="#ffedd5"/>
      <circle cx="30" cy="42" r="9" fill="#1e293b"/>
      <circle cx="70" cy="42" r="9" fill="#1e293b"/>
      <path d="M30 34C32 20 40 16 50 16C60 16 68 20 70 34C64 30 58 30 50 30C42 30 36 30 30 34Z" fill="#1e293b"/>
      <circle cx="43" cy="41" r="2.5" fill="#1e293b"/>
      <circle cx="57" cy="41" r="2.5" fill="#1e293b"/>
      <path d="M45 50C48 54 52 54 55 50" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 95C22 75 34 65 50 65C66 65 78 75 78 95V100H22V95Z" fill="#fdf4b0"/>
      <path d="M38 65L50 80L62 65" fill="#5bcebf"/>
    </svg>`
  },

  // --- TECH & CÓDIGO ---
  {
    id: 'avatar-tech-1',
    name: 'Dev FullStack (Capuz Hacker)',
    category: 'tech',
    categoryLabel: 'Tech & Código',
    bgColor: '#132f38',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#0f172a"/>
      <!-- Capuz escuro -->
      <path d="M24 55C24 30 34 16 50 16C66 16 76 30 76 55C76 68 70 70 66 70C64 60 60 52 50 52C40 52 36 60 34 70C30 70 24 68 24 55Z" fill="#1e293b"/>
      <!-- Rosto na sombra -->
      <ellipse cx="50" cy="45" rx="16" ry="17" fill="#020617"/>
      <!-- Terminal / Olhos em código neon -->
      <rect x="39" y="42" width="7" height="3" rx="1.5" fill="#5bcebf"/>
      <rect x="54" y="42" width="7" height="3" rx="1.5" fill="#5bcebf"/>
      <!-- Símbolo de código no peito -->
      <path d="M20 95C20 75 34 66 50 66C66 66 80 75 80 95V100H20V95Z" fill="#132f38"/>
      <text x="50" y="86" text-anchor="middle" fill="#5bcebf" font-size="14" font-family="monospace" font-weight="bold">&lt;/&gt;</text>
    </svg>`
  },
  {
    id: 'avatar-tech-2',
    name: 'Arquiteta Cloud (DevOps)',
    category: 'tech',
    categoryLabel: 'Tech & Código',
    bgColor: '#e3f7f5',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#32b9be"/>
      <circle cx="50" cy="41" r="21" fill="#fed7aa"/>
      <path d="M28 32C30 18 42 15 50 15C58 15 70 18 72 32C72 36 68 34 64 30C58 34 42 34 36 30C32 34 28 36 28 32Z" fill="#312e81"/>
      <circle cx="42" cy="39" r="2.5" fill="#1e1b4b"/>
      <circle cx="58" cy="39" r="2.5" fill="#1e1b4b"/>
      <path d="M45 48C48 51 52 51 55 48" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
      <!-- Óculos futuristas de RA -->
      <path d="M34 36H66V43H34V36Z" rx="2" fill="none" stroke="#fdf4b0" stroke-width="2"/>
      <line x1="36" y1="39" x2="64" y2="39" stroke="#fdf4b0" stroke-width="1.5" stroke-dasharray="2 2"/>
      <!-- Camiseta com símbolo de Nuvem -->
      <path d="M20 95C20 75 34 65 50 65C66 65 80 75 80 95V100H20V95Z" fill="#1e1b4b"/>
      <path d="M43 83C41 83 40 81 40 80C40 78 42 77 44 77C45 75 47 74 49 74C52 74 54 75 55 77C57 77 58 78 58 80C58 82 56 83 55 83H43Z" fill="#5bcebf"/>
    </svg>`
  },
  {
    id: 'avatar-tech-3',
    name: 'Cientista de Dados (IA & ML)',
    category: 'tech',
    categoryLabel: 'Tech & Código',
    bgColor: '#edf9f7',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2e97b7"/>
      <circle cx="50" cy="40" r="21" fill="#ffedd5"/>
      <path d="M30 30C34 18 42 16 50 16C58 16 66 18 70 30C66 28 62 26 50 26C38 26 34 28 30 30Z" fill="#18181b"/>
      <circle cx="42" cy="38" r="2.5" fill="#18181b"/>
      <circle cx="58" cy="38" r="2.5" fill="#18181b"/>
      <!-- Pontos de Rede Neural no Rosto/Badge -->
      <circle cx="32" cy="32" r="3" fill="#fdf4b0"/>
      <circle cx="68" cy="32" r="3" fill="#fdf4b0"/>
      <line x1="34" y1="33" x2="42" y2="38" stroke="#fdf4b0" stroke-width="1.5" stroke-dasharray="2 2"/>
      <line x1="66" y1="33" x2="58" y2="38" stroke="#fdf4b0" stroke-width="1.5" stroke-dasharray="2 2"/>
      <path d="M22 95C22 75 34 65 50 65C66 65 78 75 78 95V100H22V95Z" fill="#09090b"/>
      <!-- Símbolo de matriz de dados -->
      <circle cx="45" cy="80" r="2.5" fill="#5bcebf"/>
      <circle cx="55" cy="80" r="2.5" fill="#5bcebf"/>
      <circle cx="50" cy="88" r="2.5" fill="#a4dcb9"/>
      <line x1="45" y1="80" x2="55" y2="80" stroke="#5bcebf" stroke-width="1.5"/>
      <line x1="45" y1="80" x2="50" y2="88" stroke="#5bcebf" stroke-width="1.5"/>
      <line x1="55" y1="80" x2="50" y2="88" stroke="#5bcebf" stroke-width="1.5"/>
    </svg>`
  },

  // --- MASCOTES DO SABER ---
  {
    id: 'avatar-mascot-owl',
    name: 'Coruja Atena (Sabedoria & Foco)',
    category: 'mascots',
    categoryLabel: 'Mascotes do Saber',
    bgColor: '#fffde0',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2e97b7"/>
      <!-- Orelhas da coruja -->
      <polygon points="32,24 24,10 40,20" fill="#132f38"/>
      <polygon points="68,24 76,10 60,20" fill="#132f38"/>
      <!-- Corpo/Cabeça -->
      <ellipse cx="50" cy="48" rx="26" ry="28" fill="#132f38"/>
      <!-- Peito fofo com pena -->
      <ellipse cx="50" cy="62" rx="16" ry="18" fill="#a4dcb9"/>
      <!-- Olhos grandes e sábios -->
      <circle cx="39" cy="42" r="10" fill="#ffffff"/>
      <circle cx="61" cy="42" r="10" fill="#ffffff"/>
      <circle cx="39" cy="42" r="5" fill="#132f38"/>
      <circle cx="61" cy="42" r="5" fill="#132f38"/>
      <circle cx="41" cy="40" r="2" fill="#ffffff"/>
      <circle cx="63" cy="40" r="2" fill="#ffffff"/>
      <!-- Óculos de leitura na coruja -->
      <circle cx="39" cy="42" r="11" stroke="#fdf4b0" stroke-width="2.5" fill="none"/>
      <circle cx="61" cy="42" r="11" stroke="#fdf4b0" stroke-width="2.5" fill="none"/>
      <line x1="50" y1="42" x2="50" y2="42" stroke="#fdf4b0" stroke-width="2.5"/>
      <!-- Bico -->
      <polygon points="50,48 46,54 54,54" fill="#f59e0b"/>
      <!-- Livro aberto abaixo -->
      <path d="M30 86C38 82 46 82 50 85C54 82 62 82 70 86V95C62 91 54 91 50 93C46 91 38 91 30 95V86Z" fill="#fdf4b0"/>
    </svg>`
  },
  {
    id: 'avatar-mascot-fox',
    name: 'Raposa Curiosa (Criatividade)',
    category: 'mascots',
    categoryLabel: 'Mascotes do Saber',
    bgColor: '#fdf6dc',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#5bcebf"/>
      <!-- Orelhas -->
      <polygon points="26,30 20,8 42,22" fill="#ea580c"/>
      <polygon points="26,26 23,14 36,22" fill="#ffffff"/>
      <polygon points="74,30 80,8 58,22" fill="#ea580c"/>
      <polygon points="74,26 77,14 64,22" fill="#ffffff"/>
      <!-- Rosto raposa -->
      <path d="M22 36C22 55 50 74 50 74C50 74 78 55 78 36C78 24 64 22 50 22C36 22 22 24 22 36Z" fill="#ea580c"/>
      <!-- Bochechas brancas -->
      <path d="M26 44C32 58 50 72 50 72C50 72 68 58 74 44C70 42 62 46 50 56C38 46 30 42 26 44Z" fill="#ffffff"/>
      <!-- Olhos e Focinho -->
      <circle cx="38" cy="40" r="3.5" fill="#1e293b"/>
      <circle cx="62" cy="40" r="3.5" fill="#1e293b"/>
      <ellipse cx="50" cy="65" rx="4" ry="3" fill="#1e293b"/>
      <!-- Beca / Laço acadêmico -->
      <path d="M28 88C28 78 38 72 50 72C62 72 72 78 72 88V100H28V88Z" fill="#132f38"/>
      <polygon points="50,74 44,84 56,84" fill="#a4dcb9"/>
    </svg>`
  },
  {
    id: 'avatar-mascot-cat',
    name: 'Gato Estudioso (Café & Livros)',
    category: 'mascots',
    categoryLabel: 'Mascotes do Saber',
    bgColor: '#edf9f7',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#32b9be"/>
      <!-- Orelhas -->
      <polygon points="30,30 24,14 42,24" fill="#334155"/>
      <polygon points="70,30 76,14 58,24" fill="#334155"/>
      <polygon points="31,27 27,18 39,24" fill="#fca5a5"/>
      <polygon points="69,27 73,18 61,24" fill="#fca5a5"/>
      <!-- Cabeça -->
      <circle cx="50" cy="45" r="23" fill="#334155"/>
      <!-- Olhos brilhantes verdes -->
      <ellipse cx="41" cy="43" rx="4" ry="6" fill="#a4dcb9"/>
      <ellipse cx="59" cy="43" rx="4" ry="6" fill="#a4dcb9"/>
      <circle cx="41" cy="43" r="2" fill="#0f172a"/>
      <circle cx="59" cy="43" r="2" fill="#0f172a"/>
      <!-- Nariz e bigodes -->
      <polygon points="50,50 48,53 52,53" fill="#fca5a5"/>
      <line x1="34" y1="52" x2="22" y2="50" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="34" y1="54" x2="22" y2="56" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="66" y1="52" x2="78" y2="50" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="66" y1="54" x2="78" y2="56" stroke="#e2e8f0" stroke-width="1.5"/>
      <!-- Xícara de café no peito -->
      <path d="M26 95C26 78 36 68 50 68C64 68 74 78 74 95V100H26V95Z" fill="#132f38"/>
      <rect x="44" y="80" width="12" height="12" rx="3" fill="#fdf4b0"/>
      <path d="M56 82C58 82 60 84 60 86C60 88 58 90 56 90" stroke="#fdf4b0" stroke-width="2" fill="none"/>
    </svg>`
  },

  // --- MINIMALISTAS & GRADIENTES ---
  {
    id: 'avatar-minimal-graduate',
    name: 'Chapéu de Formatura (Graduação)',
    category: 'minimal',
    categoryLabel: 'Minimalistas & Gradientes',
    bgColor: '#e3f7f5',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#5bcebf"/>
          <stop offset="0.5" stop-color="#32b9be"/>
          <stop offset="1" stop-color="#2e97b7"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad-grad)"/>
      <polygon points="50,26 84,38 50,50 16,38" fill="#ffffff"/>
      <path d="M30 46V64C30 72 40 76 50 76C60 76 70 72 70 64V46L50 54L30 46Z" fill="#132f38"/>
      <!-- Pompom do chapéu -->
      <circle cx="82" cy="40" r="3" fill="#fdf4b0"/>
      <path d="M82 43V58" stroke="#fdf4b0" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'avatar-minimal-openbook',
    name: 'Livro do Conhecimento (Saber Aberto)',
    category: 'minimal',
    categoryLabel: 'Minimalistas & Gradientes',
    bgColor: '#fffde6',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#132f38"/>
      <!-- Livro aberto em perspectiva -->
      <path d="M50 42C40 34 26 36 18 39V74C26 71 40 69 50 77C60 69 74 71 82 74V39C74 36 60 34 50 42Z" fill="#5bcebf"/>
      <path d="M50 44C42 37 30 39 23 41V71C30 69 42 67 50 74C58 67 70 69 77 71V41C70 39 58 37 50 44Z" fill="#ffffff"/>
      <line x1="50" y1="44" x2="50" y2="74" stroke="#2e97b7" stroke-width="3"/>
      <!-- Estrela dourada de conquista em cima -->
      <polygon points="50,18 53,24 60,25 55,29 57,36 50,32 43,36 45,29 40,25 47,24" fill="#fdf4b0"/>
    </svg>`
  },
  {
    id: 'avatar-minimal-atom',
    name: 'Átomo & Pesquisa Científica',
    category: 'minimal',
    categoryLabel: 'Minimalistas & Gradientes',
    bgColor: '#e8fbf6',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2e97b7"/>
      <!-- Órbitas -->
      <ellipse cx="50" cy="50" rx="34" ry="12" stroke="#fdf4b0" stroke-width="3" fill="none" transform="rotate(30 50 50)"/>
      <ellipse cx="50" cy="50" rx="34" ry="12" stroke="#5bcebf" stroke-width="3" fill="none" transform="rotate(-30 50 50)"/>
      <ellipse cx="50" cy="50" rx="34" ry="12" stroke="#a4dcb9" stroke-width="3" fill="none" transform="rotate(90 50 50)"/>
      <!-- Núcleo atômico -->
      <circle cx="50" cy="50" r="8" fill="#ffffff"/>
      <circle cx="50" cy="50" r="5" fill="#132f38"/>
      <!-- Elétrons -->
      <circle cx="72" cy="38" r="3" fill="#fdf4b0"/>
      <circle cx="28" cy="62" r="3" fill="#5bcebf"/>
      <circle cx="50" cy="20" r="3" fill="#a4dcb9"/>
    </svg>`
  },
  {
    id: 'avatar-minimal-compass',
    name: 'Bússola do Futuro (Orientação)',
    category: 'minimal',
    categoryLabel: 'Minimalistas & Gradientes',
    bgColor: '#edf8f5',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="comp-bg" x1="0" y1="0" x2="100" y2="100">
          <stop stop-color="#132f38"/>
          <stop offset="1" stop-color="#2e97b7"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#comp-bg)"/>
      <circle cx="50" cy="50" r="36" stroke="#5bcebf" stroke-width="2.5" fill="none"/>
      <circle cx="50" cy="50" r="30" stroke="#a4dcb9" stroke-dasharray="3 3" stroke-width="1.5" fill="none"/>
      <!-- Ponteiro da bússola -->
      <polygon points="50,22 56,50 50,44 44,50" fill="#fdf4b0"/>
      <polygon points="50,78 56,50 50,56 44,50" fill="#ffffff"/>
      <circle cx="50" cy="50" r="4" fill="#32b9be"/>
    </svg>`
  }
];

export const getAvatarById = (id) => {
  return PREEXISTING_AVATARS.find((a) => a.id === id) || null;
};
