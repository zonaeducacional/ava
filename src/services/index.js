import { db } from '../lib/db.js';

// Utilitário para remover senha dos dados de usuário
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

// Sessão do usuário atual em localStorage
const AUTH_SESSION_KEY = 'mini_moodle_session_user_id';

// ============================================================================
// 1. AUTH SERVICE
// ============================================================================
export const authService = {
  async login(email, password) {
    // Simula pequena latência assíncrona
    await new Promise((r) => setTimeout(r, 150));

    if (!email || !password) {
      throw new Error('Por favor, informe seu e-mail e senha.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.where('users', (u) => u.email.toLowerCase() === cleanEmail && u.password === password)[0];

    if (!user) {
      throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    try {
      localStorage.setItem(AUTH_SESSION_KEY, user.id);
    } catch (e) {
      console.warn('Não foi possível persistir sessão do usuário:', e);
    }

    return sanitizeUser(user);
  },

  async register({ name, email, password, role }) {
    await new Promise((r) => setTimeout(r, 150));

    if (!name || name.trim().length < 2) {
      throw new Error('O nome deve ter pelo menos 2 caracteres.');
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new Error('Informe um endereço de e-mail válido.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }
    if (!['aluno', 'professor'].includes(role)) {
      throw new Error('Selecione um perfil válido (Aluno ou Professor).');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.where('users', (u) => u.email.toLowerCase() === cleanEmail)[0];
    if (existing) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    const newUser = db.insert('users', {
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      createdAt: new Date().toISOString()
    });

    try {
      localStorage.setItem(AUTH_SESSION_KEY, newUser.id);
    } catch (e) {
      console.warn('Erro ao salvar token de sessão:', e);
    }

    return sanitizeUser(newUser);
  },

  async getCurrentUser() {
    await new Promise((r) => setTimeout(r, 50));
    try {
      const userId = localStorage.getItem(AUTH_SESSION_KEY);
      if (!userId) return null;
      const user = db.find('users', userId);
      return sanitizeUser(user);
    } catch (e) {
      return null;
    }
  },

  async logout() {
    await new Promise((r) => setTimeout(r, 50));
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
    return true;
  }
};

// ============================================================================
// 2. USER SERVICE
// ============================================================================
export const userService = {
  async getAllUsers() {
    await new Promise((r) => setTimeout(r, 100));
    const users = db.all('users');
    return users.map(sanitizeUser);
  },

  async getUserById(id) {
    await new Promise((r) => setTimeout(r, 50));
    const user = db.find('users', id);
    return sanitizeUser(user);
  },

  async updateUserRole(userId, newRole) {
    await new Promise((r) => setTimeout(r, 100));
    if (!['aluno', 'professor', 'admin'].includes(newRole)) {
      throw new Error('Perfil inválido.');
    }
    const updated = db.update('users', userId, { role: newRole });
    if (!updated) {
      throw new Error('Usuário não encontrado.');
    }
    return sanitizeUser(updated);
  }
};

// ============================================================================
// 3. COURSE SERVICE
// ============================================================================
export const courseService = {
  async getAllCourses() {
    await new Promise((r) => setTimeout(r, 100));
    return db.all('courses');
  },

  async getCoursesByTeacher(teacherId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.where('courses', { teacherId });
  },

  async getCourseById(courseId) {
    await new Promise((r) => setTimeout(r, 100));
    const course = db.find('courses', courseId);
    if (!course) return null;

    // Buscar seções e seus respectivos itens ordenados
    const sections = db.where('sections', { courseId }).sort((a, b) => a.order - b.order);
    const allItems = db.where('items', { courseId }).sort((a, b) => a.order - b.order);

    const sectionsWithItems = sections.map((sec) => ({
      ...sec,
      items: allItems.filter((it) => it.sectionId === sec.id)
    }));

    return {
      ...course,
      sections: sectionsWithItems
    };
  },

  async createCourse({ title, description, teacherId, teacherName }) {
    await new Promise((r) => setTimeout(r, 150));
    if (!title || !title.trim()) {
      throw new Error('O título do curso é obrigatório.');
    }

    // Gera código único alfanumérico com 6 caracteres maiúsculos
    const randomCode = 'MD' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const course = db.insert('courses', {
      title: title.trim(),
      description: description ? description.trim() : '',
      code: randomCode,
      teacherId,
      teacherName,
      createdAt: new Date().toISOString()
    });

    // Cria automaticamente a primeira seção do curso
    db.insert('sections', {
      courseId: course.id,
      title: 'Tópicos Gerais e Apresentação',
      order: 1
    });

    return course;
  },

  async updateCourse(courseId, updates) {
    await new Promise((r) => setTimeout(r, 100));
    return db.update('courses', courseId, updates);
  },

  async deleteCourse(courseId) {
    await new Promise((r) => setTimeout(r, 150));
    // Remove seções, itens, matrículas e curso
    const sections = db.where('sections', { courseId });
    sections.forEach((sec) => db.remove('sections', sec.id));

    const items = db.where('items', { courseId });
    items.forEach((it) => db.remove('items', it.id));

    const enrollments = db.where('enrollments', { courseId });
    enrollments.forEach((en) => db.remove('enrollments', en.id));

    return db.remove('courses', courseId);
  },

  async addSection(courseId, title) {
    await new Promise((r) => setTimeout(r, 100));
    if (!title || !title.trim()) {
      throw new Error('O título da seção é obrigatório.');
    }
    const existing = db.where('sections', { courseId });
    const nextOrder = existing.length + 1;
    return db.insert('sections', {
      courseId,
      title: title.trim(),
      order: nextOrder
    });
  },

  async updateSection(sectionId, title) {
    await new Promise((r) => setTimeout(r, 100));
    if (!title || !title.trim()) {
      throw new Error('O título da seção é obrigatório.');
    }
    return db.update('sections', sectionId, { title: title.trim() });
  },

  async deleteSection(sectionId) {
    await new Promise((r) => setTimeout(r, 100));
    // Remove itens desta seção
    const items = db.where('items', { sectionId });
    items.forEach((it) => db.remove('items', it.id));
    return db.remove('sections', sectionId);
  },

  async addItem({ courseId, sectionId, title, type, content, assignmentData, quizData }) {
    await new Promise((r) => setTimeout(r, 150));
    if (!title || !title.trim()) {
      throw new Error('O título do item é obrigatório.');
    }

    const existingItems = db.where('items', { sectionId });
    const order = existingItems.length + 1;

    let assignmentId = null;
    let quizId = null;

    if (type === 'assignment') {
      const newAssign = db.insert('assignments', {
        courseId,
        title: title.trim(),
        description: assignmentData?.description || 'Descreva as instruções desta tarefa aqui.',
        dueDate: assignmentData?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
        maxScore: assignmentData?.maxScore ? Number(assignmentData.maxScore) : 10
      });
      assignmentId = newAssign.id;
    } else if (type === 'quiz') {
      const newQuiz = db.insert('quizzes', {
        courseId,
        title: title.trim(),
        description: quizData?.description || 'Responda as questões abaixo atentamente.',
        maxAttempts: quizData?.maxAttempts ? Number(quizData.maxAttempts) : 3,
        questions: quizData?.questions || [
          {
            id: 'q-' + Date.now(),
            text: 'Exemplo de questão de múltipla escolha:',
            points: 10,
            options: [
              { id: 'opt-1', text: 'Alternativa A (Incorreta)', isCorrect: false },
              { id: 'opt-2', text: 'Alternativa B (Correta)', isCorrect: true },
              { id: 'opt-3', text: 'Alternativa C (Incorreta)', isCorrect: false }
            ]
          }
        ]
      });
      quizId = newQuiz.id;
    }

    const newItem = db.insert('items', {
      courseId,
      sectionId,
      title: title.trim(),
      type,
      content: content || '',
      assignmentId,
      quizId,
      order
    });

    if (assignmentId) {
      db.update('assignments', assignmentId, { itemId: newItem.id });
    }
    if (quizId) {
      db.update('quizzes', quizId, { itemId: newItem.id });
    }

    return newItem;
  },

  async updateItem(itemId, updates) {
    await new Promise((r) => setTimeout(r, 100));
    return db.update('items', itemId, updates);
  },

  async deleteItem(itemId) {
    await new Promise((r) => setTimeout(r, 100));
    const item = db.find('items', itemId);
    if (item?.assignmentId) {
      db.remove('assignments', item.assignmentId);
    }
    if (item?.quizId) {
      db.remove('quizzes', item.quizId);
    }
    return db.remove('items', itemId);
  }
};

// ============================================================================
// 4. ENROLLMENT SERVICE
// ============================================================================
export const enrollmentService = {
  async enrollByCode(studentId, code) {
    await new Promise((r) => setTimeout(r, 150));
    if (!code || !code.trim()) {
      throw new Error('Informe o código de matrícula do curso.');
    }

    const cleanCode = code.trim().toUpperCase();
    const course = db.where('courses', (c) => c.code.toUpperCase() === cleanCode)[0];

    if (!course) {
      throw new Error('Curso não encontrado para o código fornecido.');
    }

    const alreadyEnrolled = db.where('enrollments', {
      courseId: course.id,
      studentId
    })[0];

    if (alreadyEnrolled) {
      throw new Error('Você já está matriculado neste curso.');
    }

    const enrollment = db.insert('enrollments', {
      courseId: course.id,
      studentId,
      enrolledAt: new Date().toISOString(),
      completedItemIds: []
    });

    return { enrollment, course };
  },

  async getEnrollmentsByUser(studentId) {
    await new Promise((r) => setTimeout(r, 100));
    const enrollments = db.where('enrollments', { studentId });

    return enrollments.map((enr) => {
      const course = db.find('courses', enr.courseId);
      const totalItems = db.where('items', { courseId: enr.courseId }).length;
      const completedCount = (enr.completedItemIds || []).length;
      const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

      return {
        ...enr,
        course,
        totalItems,
        completedCount,
        progressPercent
      };
    });
  },

  async getEnrollmentsByCourse(courseId) {
    await new Promise((r) => setTimeout(r, 100));
    const enrollments = db.where('enrollments', { courseId });
    return enrollments.map((enr) => {
      const student = sanitizeUser(db.find('users', enr.studentId));
      return {
        ...enr,
        student
      };
    });
  },

  async isStudentEnrolled(studentId, courseId) {
    const enr = db.where('enrollments', { studentId, courseId })[0];
    return !!enr;
  },

  async toggleItemCompleted(studentId, courseId, itemId) {
    await new Promise((r) => setTimeout(r, 50));
    const enr = db.where('enrollments', { studentId, courseId })[0];
    if (!enr) {
      throw new Error('Matrícula não encontrada.');
    }

    const currentCompleted = enr.completedItemIds || [];
    let updatedCompleted;
    if (currentCompleted.includes(itemId)) {
      updatedCompleted = currentCompleted.filter((id) => id !== itemId);
    } else {
      updatedCompleted = [...currentCompleted, itemId];
    }

    const updated = db.update('enrollments', enr.id, {
      completedItemIds: updatedCompleted
    });

    const totalItems = db.where('items', { courseId }).length;
    const progressPercent = totalItems > 0 ? Math.round((updatedCompleted.length / totalItems) * 100) : 0;

    return {
      completedItemIds: updatedCompleted,
      progressPercent
    };
  },

  async getCourseProgress(studentId, courseId) {
    const enr = db.where('enrollments', { studentId, courseId })[0];
    const totalItems = db.where('items', { courseId }).length;
    if (!enr || totalItems === 0) return { completedCount: 0, totalItems, progressPercent: 0 };
    const completedCount = (enr.completedItemIds || []).length;
    return {
      completedCount,
      totalItems,
      progressPercent: Math.round((completedCount / totalItems) * 100)
    };
  }
};

// ============================================================================
// 5. ASSIGNMENT SERVICE
// ============================================================================
export const assignmentService = {
  async getAssignment(assignmentId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.find('assignments', assignmentId);
  },

  async getAssignmentByItem(itemId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.where('assignments', { itemId })[0] || null;
  },

  async getSubmissionsByAssignment(assignmentId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.where('submissions', { assignmentId });
  },

  async getStudentSubmission(assignmentId, studentId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.where('submissions', { assignmentId, studentId })[0] || null;
  },

  async submitAssignment(assignmentId, studentId, studentName, content) {
    await new Promise((r) => setTimeout(r, 150));
    if (!content || !content.trim()) {
      throw new Error('O conteúdo da entrega não pode estar vazio.');
    }

    const existing = db.where('submissions', { assignmentId, studentId })[0];
    if (existing) {
      // Atualiza entrega existente (se ainda não corrigida ou reenvio)
      return db.update('submissions', existing.id, {
        content: content.trim(),
        submittedAt: new Date().toISOString()
      });
    }

    return db.insert('submissions', {
      assignmentId,
      studentId,
      studentName,
      content: content.trim(),
      submittedAt: new Date().toISOString(),
      score: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null
    });
  },

  async gradeSubmission(submissionId, score, feedback, teacherName) {
    await new Promise((r) => setTimeout(r, 150));
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      throw new Error('A nota deve ser um número entre 0 e 10.');
    }

    return db.update('submissions', submissionId, {
      score: numScore,
      feedback: feedback ? feedback.trim() : '',
      gradedAt: new Date().toISOString(),
      gradedBy: teacherName
    });
  },

  async getPendingCountForTeacher(teacherId) {
    const teacherCourses = db.where('courses', { teacherId });
    const courseIds = teacherCourses.map((c) => c.id);
    const assignments = db.where('assignments', (a) => courseIds.includes(a.courseId));
    const assignmentIds = assignments.map((a) => a.id);

    const pendingSubmissions = db.where(
      'submissions',
      (s) => assignmentIds.includes(s.assignmentId) && (s.score === null || s.score === undefined)
    );
    return pendingSubmissions.length;
  }
};

// ============================================================================
// 6. QUIZ SERVICE
// ============================================================================
export const quizService = {
  async getQuiz(quizId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.find('quizzes', quizId);
  },

  async getQuizByItem(itemId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.where('quizzes', { itemId })[0] || null;
  },

  async updateQuiz(quizId, updates) {
    await new Promise((r) => setTimeout(r, 150));
    return db.update('quizzes', quizId, updates);
  },

  async getStudentAttempts(quizId, studentId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.where('quiz_attempts', { quizId, studentId }).sort(
      (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
    );
  },

  async submitQuizAttempt(quizId, studentId, studentName, userAnswers) {
    await new Promise((r) => setTimeout(r, 150));
    const quiz = db.find('quizzes', quizId);
    if (!quiz) {
      throw new Error('Quiz não encontrado.');
    }

    const previousAttempts = db.where('quiz_attempts', { quizId, studentId });
    if (previousAttempts.length >= quiz.maxAttempts) {
      throw new Error(`Limite máximo de ${quiz.maxAttempts} tentativas já atingido.`);
    }

    let earnedPoints = 0;
    let totalPoints = 0;

    // Correção automática das questões
    quiz.questions.forEach((q) => {
      const qPoints = q.points || 10 / quiz.questions.length;
      totalPoints += qPoints;

      const chosenOptionId = userAnswers[q.id];
      const correctOption = q.options.find((opt) => opt.isCorrect);

      if (correctOption && chosenOptionId === correctOption.id) {
        earnedPoints += qPoints;
      }
    });

    // Normaliza nota final para escala de 0 a 10
    const finalScore = totalPoints > 0 ? parseFloat(((earnedPoints / totalPoints) * 10).toFixed(1)) : 0;
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    const attempt = db.insert('quiz_attempts', {
      quizId,
      studentId,
      studentName,
      answers: userAnswers,
      score: finalScore,
      maxScore: 10,
      percentage,
      attemptedAt: new Date().toISOString()
    });

    return attempt;
  }
};

// ============================================================================
// 7. ANNOUNCEMENT SERVICE
// ============================================================================
export const announcementService = {
  async getAnnouncementsByCourse(courseId) {
    await new Promise((r) => setTimeout(r, 100));
    const list = db.where('announcements', { courseId });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createAnnouncement({ courseId, title, content, authorName, authorRole }) {
    await new Promise((r) => setTimeout(r, 150));
    if (!title || !title.trim() || !content || !content.trim()) {
      throw new Error('Título e conteúdo do aviso são obrigatórios.');
    }

    return db.insert('announcements', {
      courseId,
      title: title.trim(),
      content: content.trim(),
      authorName,
      authorRole,
      createdAt: new Date().toISOString()
    });
  },

  async deleteAnnouncement(announcementId) {
    await new Promise((r) => setTimeout(r, 100));
    return db.remove('announcements', announcementId);
  }
};

// ============================================================================
// 8. GRADE SERVICE
// ============================================================================
export const gradeService = {
  async getStudentGrades(studentId) {
    await new Promise((r) => setTimeout(r, 150));
    const enrollments = db.where('enrollments', { studentId });
    const results = [];

    for (const enr of enrollments) {
      const course = db.find('courses', enr.courseId);
      if (!course) continue;

      // Tarefas
      const assignments = db.where('assignments', { courseId: course.id });
      for (const assign of assignments) {
        const submission = db.where('submissions', { assignmentId: assign.id, studentId })[0];
        results.push({
          id: `grade-assign-${assign.id}`,
          courseId: course.id,
          courseTitle: course.title,
          activityId: assign.id,
          activityTitle: assign.title,
          type: 'Tarefa',
          category: 'tarefa',
          dueDate: assign.dueDate,
          score: submission?.score ?? null,
          maxScore: assign.maxScore || 10,
          status: submission ? (submission.score !== null ? 'Avaliada' : 'Entregue') : 'Pendente',
          feedback: submission?.feedback || null,
          submittedAt: submission?.submittedAt || null,
          gradedAt: submission?.gradedAt || null,
          gradedBy: submission?.gradedBy || null
        });
      }

      // Quizzes
      const quizzes = db.where('quizzes', { courseId: course.id });
      for (const quiz of quizzes) {
        const attempts = db.where('quiz_attempts', { quizId: quiz.id, studentId });
        const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
        const lastAttempt = attempts[0] || null;

        results.push({
          id: `grade-quiz-${quiz.id}`,
          courseId: course.id,
          courseTitle: course.title,
          activityId: quiz.id,
          activityTitle: quiz.title,
          type: 'Quiz',
          category: 'quiz',
          dueDate: null,
          score: bestScore,
          maxScore: 10,
          attemptsCount: attempts.length,
          maxAttempts: quiz.maxAttempts,
          status: attempts.length > 0 ? 'Concluído' : 'Não iniciado',
          feedback: attempts.length > 0 ? `${attempts.length} de ${quiz.maxAttempts} tentativa(s) realizada(s)` : null,
          submittedAt: lastAttempt?.attemptedAt || null,
          gradedAt: lastAttempt?.attemptedAt || null,
          gradedBy: 'Correção Automática'
        });
      }
    }

    return results;
  },

  async getCourseGradebook(courseId) {
    await new Promise((r) => setTimeout(r, 150));
    const course = db.find('courses', courseId);
    if (!course) return null;

    const enrollments = db.where('enrollments', { courseId });
    const assignments = db.where('assignments', { courseId });
    const quizzes = db.where('quizzes', { courseId });

    const activities = [
      ...assignments.map((a) => ({ id: a.id, title: a.title, type: 'Tarefa', maxScore: a.maxScore || 10 })),
      ...quizzes.map((q) => ({ id: q.id, title: q.title, type: 'Quiz', maxScore: 10 }))
    ];

    const studentRows = enrollments.map((enr) => {
      const student = sanitizeUser(db.find('users', enr.studentId)) || { name: 'Desconhecido', email: '-' };
      const grades = {};
      let totalEarned = 0;
      let evaluatedCount = 0;

      // Notas de tarefas
      assignments.forEach((a) => {
        const sub = db.where('submissions', { assignmentId: a.id, studentId: enr.studentId })[0];
        const score = sub && sub.score !== null ? sub.score : null;
        grades[a.id] = score;
        if (score !== null) {
          totalEarned += score;
          evaluatedCount++;
        }
      });

      // Notas de quizzes (melhor nota)
      quizzes.forEach((q) => {
        const attempts = db.where('quiz_attempts', { quizId: q.id, studentId: enr.studentId });
        const bestScore = attempts.length > 0 ? Math.max(...attempts.map((atm) => atm.score)) : null;
        grades[q.id] = bestScore;
        if (bestScore !== null) {
          totalEarned += bestScore;
          evaluatedCount++;
        }
      });

      const average = evaluatedCount > 0 ? parseFloat((totalEarned / evaluatedCount).toFixed(2)) : null;

      return {
        studentId: enr.studentId,
        studentName: student.name,
        studentEmail: student.email,
        grades,
        average
      };
    });

    return {
      course,
      activities,
      students: studentRows
    };
  },

  exportGradebookCSV(gradebookData) {
    if (!gradebookData || !gradebookData.students) {
      throw new Error('Dados do boletim insuficientes para exportação.');
    }

    const { course, activities, students } = gradebookData;

    // Cabeçalhos CSV
    const headers = ['Aluno', 'E-mail', ...activities.map((a) => `${a.title} (${a.type})`), 'Média'];

    const rows = students.map((s) => {
      const studentGrades = activities.map((a) => {
        const score = s.grades[a.id];
        return score !== null && score !== undefined ? score.toString().replace('.', ',') : '-';
      });
      const avg = s.average !== null && s.average !== undefined ? s.average.toString().replace('.', ',') : '-';
      return [s.studentName, s.studentEmail, ...studentGrades, avg];
    });

    // Constrói CSV com escape para aspas e vírgulas
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(';')
      )
      .join('\r\n');

    // UTF-8 BOM (\uFEFF) para garantir caracteres acentuados legíveis no Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = course.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    link.setAttribute('download', `boletim_${sanitizedTitle}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// ============================================================================
// 9. NOTIFICATION SERVICE
// ============================================================================
export const notificationService = {
  getReadNotificationIds(userId) {
    try {
      const stored = localStorage.getItem(`lms_read_notifs_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  markAsRead(userId, notificationId) {
    try {
      const current = this.getReadNotificationIds(userId);
      if (!current.includes(notificationId)) {
        const updated = [...current, notificationId];
        localStorage.setItem(`lms_read_notifs_${userId}`, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Erro ao salvar notificação lida:', e);
    }
  },

  markAllAsRead(userId, notificationIds) {
    try {
      const current = this.getReadNotificationIds(userId);
      const updated = Array.from(new Set([...current, ...notificationIds]));
      localStorage.setItem(`lms_read_notifs_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao marcar todas como lidas:', e);
    }
  },

  async getStudentNotifications(studentId) {
    await new Promise((r) => setTimeout(r, 60));
    const enrollments = db.where('enrollments', { studentId });
    const notifications = [];
    const readIds = this.getReadNotificationIds(studentId);

    for (const enr of enrollments) {
      const course = db.find('courses', enr.courseId);
      if (!course) continue;

      // 1. Avisos recentes publicados no curso
      const announcements = db.where('announcements', { courseId: course.id });
      for (const ann of announcements) {
        notifications.push({
          id: `notif-ann-${ann.id}`,
          type: 'aviso',
          title: `Novo Comunicado: ${ann.title}`,
          description: ann.content.length > 100 ? ann.content.substring(0, 100) + '...' : ann.content,
          courseId: course.id,
          courseTitle: course.title,
          authorName: ann.authorName || 'Professor',
          timestamp: ann.createdAt,
          link: `/courses/${course.id}`,
          actionLabel: 'Ver Comunicado',
          isRead: readIds.includes(`notif-ann-${ann.id}`),
          icon: '📢',
          color: 'var(--info)'
        });
      }

      // 2. Tarefas do curso (Pendentes de envio ou Notas publicadas)
      const assignments = db.where('assignments', { courseId: course.id });
      for (const assign of assignments) {
        const submission = db.where('submissions', { assignmentId: assign.id, studentId })[0];

        if (submission && submission.score !== null && submission.score !== undefined) {
          // NOTA PUBLICADA
          notifications.push({
            id: `notif-grade-${submission.id}`,
            type: 'nota',
            title: `Nota Publicada: ${assign.title}`,
            description: `Sua tarefa foi corrigida com nota ${submission.score} de ${assign.maxScore || 10}.${
              submission.feedback ? ` Comentário: "${submission.feedback}"` : ''
            }`,
            courseId: course.id,
            courseTitle: course.title,
            timestamp: submission.gradedAt || submission.submittedAt,
            link: `/grades?courseId=${course.id}`,
            actionLabel: 'Ver Boletim',
            isRead: readIds.includes(`notif-grade-${submission.id}`),
            icon: '⭐',
            color: 'var(--success)'
          });
        } else if (!submission) {
          // NOVA TAREFA ATRIBUÍDA PENDENTE
          notifications.push({
            id: `notif-task-${assign.id}`,
            type: 'tarefa',
            title: `Nova Tarefa Atribuída: ${assign.title}`,
            description: assign.dueDate
              ? `Prazo de entrega até ${new Date(assign.dueDate).toLocaleDateString('pt-BR')}. Não deixe para a última hora!`
              : 'Nova tarefa disponível para desenvolvimento e envio.',
            courseId: course.id,
            courseTitle: course.title,
            timestamp: assign.dueDate || course.createdAt,
            link: `/courses/${course.id}/assignment/${assign.id}`,
            actionLabel: 'Entregar Tarefa',
            isRead: readIds.includes(`notif-task-${assign.id}`),
            icon: '📝',
            color: 'var(--warning)'
          });
        }
      }

      // 3. Quizzes avaliados
      const quizzes = db.where('quizzes', { courseId: course.id });
      for (const quiz of quizzes) {
        const attempts = db.where('quiz_attempts', { quizId: quiz.id, studentId });
        if (attempts.length > 0) {
          const latestAttempt = attempts[0];
          notifications.push({
            id: `notif-quiz-${latestAttempt.id}`,
            type: 'nota',
            title: `Resultado de Quiz: ${quiz.title}`,
            description: `Você alcançou nota ${latestAttempt.score}/10 (${latestAttempt.percentage}% de acertos).`,
            courseId: course.id,
            courseTitle: course.title,
            timestamp: latestAttempt.attemptedAt,
            link: `/courses/${course.id}/quiz/${quiz.id}`,
            actionLabel: 'Revisar Quiz',
            isRead: readIds.includes(`notif-quiz-${latestAttempt.id}`),
            icon: '❓',
            color: 'var(--secondary)'
          });
        }
      }
    }

    return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getTeacherNotifications(teacherId) {
    await new Promise((r) => setTimeout(r, 60));
    const teacherCourses = db.where('courses', { teacherId });
    const notifications = [];
    const readIds = this.getReadNotificationIds(teacherId);

    for (const course of teacherCourses) {
      // 1. Entregas de tarefas que aguardam correção
      const assignments = db.where('assignments', { courseId: course.id });
      for (const assign of assignments) {
        const submissions = db.where('submissions', { assignmentId: assign.id });
        const pendingSubs = submissions.filter((s) => s.score === null || s.score === undefined);

        for (const sub of pendingSubs) {
          notifications.push({
            id: `notif-sub-${sub.id}`,
            type: 'tarefa',
            title: `Nova Entrega: ${assign.title}`,
            description: `O aluno ${sub.studentName} enviou a resposta e aguarda sua avaliação.`,
            courseId: course.id,
            courseTitle: course.title,
            timestamp: sub.submittedAt,
            link: `/courses/${course.id}/assignment/${assign.id}`,
            actionLabel: 'Corrigir Entrega',
            isRead: readIds.includes(`notif-sub-${sub.id}`),
            icon: '📥',
            color: 'var(--warning)'
          });
        }
      }

      // 2. Tentativas recentes de quizzes finalizadas por estudantes
      const quizzes = db.where('quizzes', { courseId: course.id });
      for (const quiz of quizzes) {
        const attempts = db.where('quiz_attempts', { quizId: quiz.id });
        for (const atm of attempts.slice(0, 5)) {
          notifications.push({
            id: `notif-atm-${atm.id}`,
            type: 'nota',
            title: `Quiz Concluído: ${quiz.title}`,
            description: `${atm.studentName} finalizou a avaliação com nota ${atm.score}/10.`,
            courseId: course.id,
            courseTitle: course.title,
            timestamp: atm.attemptedAt,
            link: `/grades?courseId=${course.id}`,
            actionLabel: 'Ver no Boletim',
            isRead: readIds.includes(`notif-atm-${atm.id}`),
            icon: '📊',
            color: 'var(--success)'
          });
        }
      }

      // 3. Avisos ativos postados no curso
      const announcements = db.where('announcements', { courseId: course.id });
      for (const ann of announcements) {
        notifications.push({
          id: `notif-teach-ann-${ann.id}`,
          type: 'aviso',
          title: `Aviso Ativo: ${ann.title}`,
          description: `Comunicado visível para todos os alunos de ${course.title}.`,
          courseId: course.id,
          courseTitle: course.title,
          timestamp: ann.createdAt,
          link: `/courses/${course.id}`,
          actionLabel: 'Abrir Curso',
          isRead: readIds.includes(`notif-teach-ann-${ann.id}`),
          icon: '📢',
          color: 'var(--info)'
        });
      }
    }

    return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// ============================================================================
// 10. LIVE SESSION SERVICE (JITSI MEET AULA AO VIVO)
// ============================================================================
export const liveSessionService = {
  async getLiveSession(courseId) {
    await new Promise((r) => setTimeout(r, 40));
    const active = db.where('live_sessions', (s) => s.courseId === courseId && s.status === 'active')[0];
    return active || null;
  },

  async startLiveSession(courseId, { title, description, teacherId, teacherName, roomName }) {
    await new Promise((r) => setTimeout(r, 80));
    // Encerra qualquer sessão ativa anterior deste curso
    const existing = db.where('live_sessions', (s) => s.courseId === courseId && s.status === 'active');
    existing.forEach((s) => {
      db.update('live_sessions', s.id, {
        status: 'ended',
        endedAt: new Date().toISOString()
      });
    });

    const session = db.insert('live_sessions', {
      courseId,
      title: title?.trim() || 'Aula ao Vivo',
      description: description?.trim() || 'Sessão de aula ao vivo e tutoria síncrona.',
      teacherId,
      teacherName,
      roomName,
      status: 'active',
      startedAt: new Date().toISOString(),
      endedAt: null
    });

    return session;
  },

  async endLiveSession(sessionId) {
    await new Promise((r) => setTimeout(r, 60));
    return db.update('live_sessions', sessionId, {
      status: 'ended',
      endedAt: new Date().toISOString()
    });
  }
};

// ============================================================================
// 11. COURSE TEXT & DISCUSSION SERVICE (LEITURAS E CHAT ESTILO GOOGLE CLASSROOM)
// ============================================================================
export const courseTextService = {
  async getTextsByCourse(courseId) {
    await new Promise((r) => setTimeout(r, 40));
    const texts = db.where('course_texts', (t) => t.courseId === courseId);
    return texts.map((t) => {
      const comments = db.where('text_comments', (c) => c.textId === t.id);
      return {
        ...t,
        commentsCount: comments.length
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getTextById(textId) {
    await new Promise((r) => setTimeout(r, 40));
    const text = db.findById('course_texts', textId);
    if (!text) return null;
    const comments = db.where('text_comments', (c) => c.textId === textId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return {
      ...text,
      comments
    };
  },

  async createText(courseId, { title, summary, content, authorId, authorName, authorRole, sourceType = 'text', fileName = '', fileSize = '' }) {
    await new Promise((r) => setTimeout(r, 80));
    if (!title?.trim()) {
      throw new Error('O título do texto é obrigatório.');
    }
    if (!content?.trim()) {
      throw new Error('O conteúdo textual é obrigatório.');
    }

    const newText = db.insert('course_texts', {
      courseId,
      title: title.trim(),
      summary: summary?.trim() || '',
      content: content.trim(),
      authorId,
      authorName,
      authorRole,
      sourceType,
      fileName,
      fileSize,
      createdAt: new Date().toISOString()
    });

    return {
      ...newText,
      comments: []
    };
  },

  async deleteText(textId) {
    await new Promise((r) => setTimeout(r, 60));
    // Remove os comentários associados
    const comments = db.where('text_comments', (c) => c.textId === textId);
    comments.forEach((c) => db.delete('text_comments', c.id));
    return db.delete('course_texts', textId);
  },

  async addComment(textId, { userId, userName, userRole, comment }) {
    await new Promise((r) => setTimeout(r, 50));
    if (!comment?.trim()) {
      throw new Error('O comentário não pode estar vazio.');
    }

    return db.insert('text_comments', {
      textId,
      userId,
      userName,
      userRole,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    });
  },

  async deleteComment(commentId) {
    await new Promise((r) => setTimeout(r, 40));
    return db.delete('text_comments', commentId);
  }
};

// ============================================================================
// 12. EXTERNAL ACTIVITIES SERVICE (ATIVIDADES COM LINKS EXTERNOS E IMAGEM)
// ============================================================================
export const externalActivityService = {
  async getActivitiesByCourse(courseId) {
    await new Promise((r) => setTimeout(r, 40));
    const items = db.where('external_activities', (a) => a.courseId === courseId);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getActivityById(activityId) {
    await new Promise((r) => setTimeout(r, 30));
    return db.findById('external_activities', activityId);
  },

  async createActivity(courseId, { title, description, url, imageUrl, category, dueDate, authorId, authorName }) {
    await new Promise((r) => setTimeout(r, 70));
    if (!title?.trim()) {
      throw new Error('O título da atividade é obrigatório.');
    }
    if (!url?.trim()) {
      throw new Error('O link externo da atividade é obrigatório.');
    }

    // Validação e normalização de URL
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Imagem padrão caso o usuário não informe ou deixe vazia
    const defaultImages = [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
    ];
    const finalImageUrl = imageUrl?.trim() || defaultImages[Math.floor(Math.random() * defaultImages.length)];

    return db.insert('external_activities', {
      courseId,
      title: title.trim(),
      description: description?.trim() || '',
      url: formattedUrl,
      imageUrl: finalImageUrl,
      category: category?.trim() || 'Prática Externa',
      dueDate: dueDate || null,
      authorId,
      authorName,
      createdAt: new Date().toISOString()
    });
  },

  async updateActivity(activityId, updates) {
    await new Promise((r) => setTimeout(r, 60));
    if (updates.url && !/^https?:\/\//i.test(updates.url.trim())) {
      updates.url = 'https://' + updates.url.trim();
    }
    return db.update('external_activities', activityId, updates);
  },

  async deleteActivity(activityId) {
    await new Promise((r) => setTimeout(r, 50));
    return db.delete('external_activities', activityId);
  }
};




