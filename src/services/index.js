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
  },

  async updateProfile(userId, updates) {
    await new Promise((r) => setTimeout(r, 100));
    const user = db.find('users', userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const allowedUpdates = {};
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length < 2) {
        throw new Error('O nome deve ter pelo menos 2 caracteres.');
      }
      allowedUpdates.name = updates.name.trim();
    }
    if (updates.email !== undefined) {
      const cleanEmail = updates.email.trim().toLowerCase();
      if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
        throw new Error('Informe um endereço de e-mail válido.');
      }
      const existing = db.where('users', (u) => u.email.toLowerCase() === cleanEmail && u.id !== userId)[0];
      if (existing) {
        throw new Error('Este e-mail já está sendo utilizado por outro usuário.');
      }
      allowedUpdates.email = cleanEmail;
    }
    if (updates.avatar !== undefined) {
      allowedUpdates.avatar = updates.avatar;
    }
    if (updates.bio !== undefined) {
      allowedUpdates.bio = updates.bio ? updates.bio.trim() : '';
    }
    if (updates.phone !== undefined) {
      allowedUpdates.phone = updates.phone ? updates.phone.trim() : '';
    }
    if (updates.institution !== undefined) {
      allowedUpdates.institution = updates.institution ? updates.institution.trim() : '';
    }
    if (updates.course !== undefined) {
      allowedUpdates.course = updates.course ? updates.course.trim() : '';
    }
    if (updates.customStatus !== undefined) {
      allowedUpdates.customStatus = updates.customStatus ? updates.customStatus.trim() : '';
    }
    if (updates.password) {
      if (updates.password.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres.');
      }
      allowedUpdates.password = updates.password;
    }

    const updated = db.update('users', userId, allowedUpdates);
    return sanitizeUser(updated);
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
  },

  async updateUserProfile(userId, updates) {
    return authService.updateProfile(userId, updates);
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

  async setItemStatus(studentId, courseId, itemId, newStatus) {
    await new Promise((r) => setTimeout(r, 50));
    const enr = db.where('enrollments', { studentId, courseId })[0];
    if (!enr) {
      throw new Error('Matrícula não encontrada.');
    }

    let completed = (enr.completedItemIds || []).filter((id) => id !== itemId);
    let inProgress = (enr.inProgressItemIds || []).filter((id) => id !== itemId);

    if (newStatus === 'completed') {
      completed.push(itemId);
    } else if (newStatus === 'in_progress') {
      inProgress.push(itemId);
    }

    db.update('enrollments', enr.id, {
      completedItemIds: completed,
      inProgressItemIds: inProgress
    });

    const totalItems = db.where('items', { courseId }).length;
    const progressPercent = totalItems > 0 ? Math.round((completed.length / totalItems) * 100) : 0;

    return {
      status: newStatus,
      completedItemIds: completed,
      inProgressItemIds: inProgress,
      progressPercent
    };
  },

  async cycleItemStatus(studentId, courseId, itemId) {
    const enr = db.where('enrollments', { studentId, courseId })[0];
    if (!enr) return null;

    const completed = enr.completedItemIds || [];
    const inProgress = enr.inProgressItemIds || [];

    let nextStatus = 'in_progress';
    if (completed.includes(itemId)) {
      nextStatus = 'pending';
    } else if (inProgress.includes(itemId)) {
      nextStatus = 'completed';
    } else {
      nextStatus = 'in_progress';
    }

    return this.setItemStatus(studentId, courseId, itemId, nextStatus);
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
  },

  async getTeacherSubmissionsOverview(teacherId, isAdmin = false) {
    await new Promise((r) => setTimeout(r, 80));

    // 1. Obter cursos do professor ou todos se admin
    let courses = [];
    if (isAdmin) {
      courses = db.all('courses');
    } else {
      courses = db.where('courses', { teacherId });
    }

    const now = Date.now();
    const allItems = [];
    const courseStatsMap = {};

    courses.forEach((c) => {
      courseStatsMap[c.id] = {
        course: c,
        assignmentsCount: 0,
        enrolledCount: 0,
        expectedSubmissions: 0,
        submissionsCount: 0,
        pendingGradeCount: 0,
        urgentTeacherCount: 0,
        urgentStudentCount: 0,
        totalUrgentCount: 0,
        gradedCount: 0,
        notSubmittedCount: 0,
        deliveryRate: 0
      };
    });

    for (const course of courses) {
      const assignments = db.where('assignments', { courseId: course.id });
      const enrollments = db.where('enrollments', { courseId: course.id });

      const students = enrollments
        .map((enr) => {
          const u = db.find('users', enr.studentId);
          return u ? { ...sanitizeUser(u), enrolledAt: enr.enrolledAt } : null;
        })
        .filter(Boolean);

      const stats = courseStatsMap[course.id];
      stats.assignmentsCount = assignments.length;
      stats.enrolledCount = students.length;
      stats.expectedSubmissions = assignments.length * students.length;

      for (const assignment of assignments) {
        for (const student of students) {
          const sub = db.where('submissions', {
            assignmentId: assignment.id,
            studentId: student.id
          })[0] || null;

          const hasSubmission = !!sub;
          const isGraded = hasSubmission && sub.score !== null && sub.score !== undefined;
          const isPendingGrade = hasSubmission && !isGraded;
          const notSubmitted = !hasSubmission;

          let status = 'not_submitted';
          let statusLabel = 'Não Entregue';
          if (isGraded) {
            status = 'graded';
            statusLabel = 'Avaliada';
          } else if (isPendingGrade) {
            status = 'pending_grade';
            statusLabel = 'Aguardando Correção';
          }

          // Verificação de Urgência
          let isUrgent = false;
          let urgencyType = null; // 'teacher_pending_critical' | 'student_overdue' | 'student_due_soon'
          let urgencyReason = null;
          let hoursLeft = null;
          let hoursWaiting = null;

          if (isPendingGrade) {
            const subTime = new Date(sub.submittedAt).getTime();
            hoursWaiting = Math.max(0, Math.round((now - subTime) / (1000 * 60 * 60)));
            const dueTime = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
            const isPastDue = dueTime && dueTime < now;

            if (hoursWaiting >= 48 || isPastDue) {
              isUrgent = true;
              urgencyType = 'teacher_pending_critical';
              urgencyReason = hoursWaiting >= 48
                ? `Aguardando avaliação há ${Math.round(hoursWaiting / 24)} dias`
                : 'Prazo final encerrado sem avaliação do docente';
            }
          } else if (notSubmitted) {
            if (assignment.dueDate) {
              const dueTime = new Date(assignment.dueDate).getTime();
              hoursLeft = Math.round((dueTime - now) / (1000 * 60 * 60));

              if (dueTime < now) {
                isUrgent = true;
                urgencyType = 'student_overdue';
                urgencyReason = 'Prazo expirado sem entrega do aluno';
              } else if (hoursLeft <= 48) {
                isUrgent = true;
                urgencyType = 'student_due_soon';
                urgencyReason = `Vence em ${hoursLeft}h sem entrega`;
              }
            }
          }

          // Atualiza estatísticas da turma
          if (hasSubmission) stats.submissionsCount++;
          if (isGraded) stats.gradedCount++;
          if (isPendingGrade) stats.pendingGradeCount++;
          if (notSubmitted) stats.notSubmittedCount++;
          if (urgencyType === 'teacher_pending_critical') stats.urgentTeacherCount++;
          if (urgencyType === 'student_overdue' || urgencyType === 'student_due_soon') stats.urgentStudentCount++;
          if (isUrgent) stats.totalUrgentCount++;

          allItems.push({
            id: sub ? sub.id : `${assignment.id}_${student.id}`,
            submissionId: sub ? sub.id : null,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            assignmentDescription: assignment.description,
            assignmentDueDate: assignment.dueDate,
            maxScore: assignment.maxScore || 10,
            courseId: course.id,
            courseTitle: course.title,
            courseCode: course.code,
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            studentAvatar: student.avatar || 'avatar-student-1',
            studentCourse: student.course || '',
            hasSubmission,
            submittedAt: sub ? sub.submittedAt : null,
            content: sub ? sub.content : null,
            score: sub && sub.score !== undefined ? sub.score : null,
            feedback: sub ? sub.feedback : null,
            gradedAt: sub ? sub.gradedAt : null,
            gradedBy: sub ? sub.gradedBy : null,
            status,
            statusLabel,
            isUrgent,
            urgencyType,
            urgencyReason,
            hoursWaiting,
            hoursLeft
          });
        }
      }

      stats.deliveryRate = stats.expectedSubmissions > 0
        ? Math.round((stats.submissionsCount / stats.expectedSubmissions) * 100)
        : 0;
    }

    const totalExpectedSubmissions = allItems.length;
    const totalSubmissions = allItems.filter((i) => i.hasSubmission).length;
    const pendingGradeCount = allItems.filter((i) => i.status === 'pending_grade').length;
    const urgentTeacherCount = allItems.filter((i) => i.urgencyType === 'teacher_pending_critical').length;
    const gradedCount = allItems.filter((i) => i.status === 'graded').length;
    const notSubmittedCount = allItems.filter((i) => i.status === 'not_submitted').length;
    const urgentStudentCount = allItems.filter((i) => i.urgencyType === 'student_overdue' || i.urgencyType === 'student_due_soon').length;
    const totalUrgentCount = allItems.filter((i) => i.isUrgent).length;
    const overallDeliveryRate = totalExpectedSubmissions > 0
      ? Math.round((totalSubmissions / totalExpectedSubmissions) * 100)
      : 0;

    return {
      courses: Object.values(courseStatsMap),
      totalCourses: courses.length,
      totalExpectedSubmissions,
      totalSubmissions,
      pendingGradeCount,
      urgentTeacherCount,
      gradedCount,
      notSubmittedCount,
      urgentStudentCount,
      totalUrgentCount,
      overallDeliveryRate,
      items: allItems
    };
  },

  async sendStudentReminder(studentId, assignmentId, courseId, teacherName = 'Docente') {
    await new Promise((r) => setTimeout(r, 100));
    const student = db.find('users', studentId);
    const assignment = db.find('assignments', assignmentId);
    if (!student || !assignment) {
      throw new Error('Estudante ou tarefa não encontrados.');
    }

    db.insert('announcements', {
      courseId,
      title: `Lembrete de Entrega: ${assignment.title}`,
      content: `Prezado(a) ${student.name}, você possui a atividade "${assignment.title}" pendente de envio. Favor submeter no ambiente virtual antes do prazo limite!`,
      authorName: teacherName,
      authorRole: 'professor',
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Lembrete enviado com sucesso para ${student.name}!`
    };
  },

  exportSubmissionsCSV(items, filterName = 'relatorio_entregas') {
    const headers = [
      'ID Registro',
      'Curso / Turma',
      'Código',
      'Aluno',
      'E-mail',
      'Tarefa',
      'Prazo Final',
      'Status Entrega',
      'Data de Envio',
      'Nota Atribuída',
      'Nota Máxima',
      'Feedback Pedagógico',
      'Urgência',
      'Motivo da Urgência'
    ];

    const rows = items.map((item) => [
      item.id,
      item.courseTitle,
      item.courseCode,
      item.studentName,
      item.studentEmail,
      item.assignmentTitle,
      item.assignmentDueDate ? new Date(item.assignmentDueDate).toLocaleDateString('pt-BR') : 'Sem data',
      item.statusLabel,
      item.submittedAt ? new Date(item.submittedAt).toLocaleString('pt-BR') : 'Não enviada',
      item.score !== null && item.score !== undefined ? item.score : '-',
      item.maxScore,
      item.feedback ? item.feedback.replace(/\r?\n/g, ' ') : '',
      item.isUrgent ? 'URGENTE' : 'Normal',
      item.urgencyReason || '-'
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(';')
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = filterName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
    link.setAttribute('download', `entregas_${sanitizedTitle}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

// ============================================================================
// 12. CALENDAR SERVICE
// ============================================================================
export const calendarService = {
  /**
   * Centraliza todos os prazos de tarefas e datas de provas/quizzes
   * para um estudante com base em seus cursos matriculados.
   */
  async getStudentCalendarEvents(studentId) {
    await new Promise((r) => setTimeout(r, 60));
    if (!studentId) return [];

    const enrollments = db.where('enrollments', { studentId });
    if (!enrollments || enrollments.length === 0) return [];

    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const enrollmentsMap = {};
    enrollments.forEach((e) => {
      enrollmentsMap[e.courseId] = e;
    });

    const events = [];

    for (const courseId of enrolledCourseIds) {
      const course = db.find('courses', courseId);
      if (!course) continue;

      const enr = enrollmentsMap[courseId];
      const completedIds = enr?.completedItemIds || [];
      const inProgressIds = enr?.inProgressItemIds || [];

      // 1. Prazos de Tarefas
      const assignments = db.where('assignments', { courseId });
      for (const a of assignments) {
        if (!a.dueDate) continue;

        const submission = db.where('submissions', { assignmentId: a.id, studentId })[0];
        let status = 'pending';
        let statusLabel = 'Pendente';

        if (submission) {
          status = 'completed';
          statusLabel = submission.score !== null ? 'Avaliada' : 'Entregue';
        } else if (inProgressIds.includes(a.itemId)) {
          status = 'in_progress';
          statusLabel = 'Em curso';
        } else if (completedIds.includes(a.itemId)) {
          status = 'completed';
          statusLabel = 'Concluído';
        }

        const isOverdue = new Date(a.dueDate).getTime() < Date.now() && status !== 'completed';

        events.push({
          id: `assign-${a.id}`,
          activityId: a.id,
          itemId: a.itemId,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          teacherName: course.teacherName || 'Docente Responsável',
          title: a.title,
          description: a.description || '',
          type: 'assignment',
          typeLabel: 'Tarefa',
          typeIcon: '📝',
          dueDate: a.dueDate,
          maxScore: a.maxScore || 10,
          status,
          statusLabel,
          submission: submission || null,
          score: submission?.score ?? null,
          feedback: submission?.feedback || null,
          isOverdue,
          link: `/courses/${course.id}/assignment/${a.id}`,
          color: '#2e97b7' // .color5
        });
      }

      // 2. Datas de Provas e Quizzes
      const quizzes = db.where('quizzes', { courseId });
      for (const q of quizzes) {
        const dueDate = q.dueDate || '2026-10-20T23:59:59.000Z';
        const attempts = db.where('quiz_attempts', { quizId: q.id, studentId });
        const hasAttempts = attempts.length > 0;
        const isCompleted = hasAttempts || completedIds.includes(q.itemId);
        const isInProgress = inProgressIds.includes(q.itemId);

        let status = 'pending';
        let statusLabel = 'Pendente';

        if (isCompleted) {
          status = 'completed';
          statusLabel = hasAttempts ? 'Realizado' : 'Concluído';
        } else if (isInProgress) {
          status = 'in_progress';
          statusLabel = 'Em curso';
        }

        const isOverdue = new Date(dueDate).getTime() < Date.now() && status !== 'completed';
        const bestScore = hasAttempts ? Math.max(...attempts.map((att) => att.score)) : null;

        events.push({
          id: `quiz-${q.id}`,
          activityId: q.id,
          itemId: q.itemId,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          teacherName: course.teacherName || 'Docente Responsável',
          title: q.title,
          description: q.description || '',
          type: 'quiz',
          typeLabel: 'Prova / Quiz',
          typeIcon: '🎯',
          dueDate,
          maxScore: 10,
          maxAttempts: q.maxAttempts || 3,
          attemptsCount: attempts.length,
          status,
          statusLabel,
          score: bestScore,
          isOverdue,
          link: `/courses/${course.id}/quiz/${q.id}`,
          color: '#5bcebf' // .color3
        });
      }

      // 3. Atividades Externas com prazo
      const extActivities = db.where('external_activities', { courseId });
      for (const ext of extActivities) {
        if (!ext.dueDate) continue;
        const isCompleted = completedIds.includes(ext.id);

        events.push({
          id: `ext-${ext.id}`,
          activityId: ext.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          teacherName: course.teacherName || ext.authorName || 'Docente',
          title: ext.title,
          description: ext.description || '',
          type: 'external',
          typeLabel: ext.category || 'Atividade Externa',
          typeIcon: '🔗',
          dueDate: ext.dueDate,
          status: isCompleted ? 'completed' : 'pending',
          statusLabel: isCompleted ? 'Concluído' : 'Pendente',
          isOverdue: new Date(ext.dueDate).getTime() < Date.now() && !isCompleted,
          link: `/courses/${course.id}`,
          color: '#32b9be' // .color4
        });
      }
    }

    return events.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },

  /**
   * Retorna eventos para professores com base nos cursos ministrados
   */
  async getTeacherCalendarEvents(teacherId) {
    await new Promise((r) => setTimeout(r, 60));
    const courses = db.where('courses', { teacherId });
    if (!courses || courses.length === 0) return [];

    const events = [];

    for (const course of courses) {
      const enrollments = db.where('enrollments', { courseId: course.id });
      const studentCount = enrollments.length;

      // Tarefas
      const assignments = db.where('assignments', { courseId: course.id });
      for (const a of assignments) {
        if (!a.dueDate) continue;
        const subs = db.where('submissions', { assignmentId: a.id });
        const gradedCount = subs.filter((s) => s.score !== null).length;

        events.push({
          id: `assign-${a.id}`,
          activityId: a.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          teacherName: course.teacherName || 'Você',
          title: a.title,
          description: a.description || '',
          type: 'assignment',
          typeLabel: 'Tarefa',
          typeIcon: '📝',
          dueDate: a.dueDate,
          maxScore: a.maxScore || 10,
          status: subs.length >= studentCount && studentCount > 0 ? 'completed' : 'pending',
          statusLabel: `${subs.length}/${studentCount} entregas (${gradedCount} avaliadas)`,
          submissionCount: subs.length,
          studentCount,
          link: `/courses/${course.id}/assignment/${a.id}`,
          color: '#2e97b7'
        });
      }

      // Quizzes
      const quizzes = db.where('quizzes', { courseId: course.id });
      for (const q of quizzes) {
        const dueDate = q.dueDate || '2026-10-20T23:59:59.000Z';
        const attempts = db.where('quiz_attempts', { quizId: q.id });
        const distinctStudents = new Set(attempts.map((at) => at.studentId)).size;

        events.push({
          id: `quiz-${q.id}`,
          activityId: q.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          teacherName: course.teacherName || 'Você',
          title: q.title,
          description: q.description || '',
          type: 'quiz',
          typeLabel: 'Prova / Quiz',
          typeIcon: '🎯',
          dueDate,
          maxScore: 10,
          status: distinctStudents >= studentCount && studentCount > 0 ? 'completed' : 'pending',
          statusLabel: `${distinctStudents}/${studentCount} alunos realizaram`,
          attemptsCount: attempts.length,
          studentCount,
          link: `/courses/${course.id}/quiz/${q.id}`,
          color: '#5bcebf'
        });
      }
    }

    return events.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },

  /**
   * Retorna todos os eventos acadêmicos do sistema
   */
  async getAllCalendarEvents() {
    await new Promise((r) => setTimeout(r, 60));
    const courses = db.all('courses');
    const events = [];

    for (const course of courses) {
      const assignments = db.where('assignments', { courseId: course.id });
      for (const a of assignments) {
        if (!a.dueDate) continue;
        events.push({
          id: `assign-${a.id}`,
          activityId: a.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          teacherName: course.teacherName || 'Geral',
          title: a.title,
          description: a.description || '',
          type: 'assignment',
          typeLabel: 'Tarefa',
          typeIcon: '📝',
          dueDate: a.dueDate,
          maxScore: a.maxScore || 10,
          status: 'pending',
          statusLabel: 'Cadastrada',
          link: `/courses/${course.id}/assignment/${a.id}`,
          color: '#2e97b7'
        });
      }

      const quizzes = db.where('quizzes', { courseId: course.id });
      for (const q of quizzes) {
        const dueDate = q.dueDate || '2026-10-20T23:59:59.000Z';
        events.push({
          id: `quiz-${q.id}`,
          activityId: q.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          teacherName: course.teacherName || 'Geral',
          title: q.title,
          description: q.description || '',
          type: 'quiz',
          typeLabel: 'Prova / Quiz',
          typeIcon: '🎯',
          dueDate,
          maxScore: 10,
          status: 'pending',
          statusLabel: 'Cadastrada',
          link: `/courses/${course.id}/quiz/${q.id}`,
          color: '#5bcebf'
        });
      }
    }

    return events.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
};

// ============================================================================
// 13. FORUM SERVICE (FÓRUM DE DÚVIDAS DO CURSO)
// ============================================================================
export const forumService = {
  /**
   * Retorna os tópicos de dúvidas de um curso com filtros opcionais
   */
  async getTopicsByCourse(courseId, { sectionId = 'all', status = 'all', search = '' } = {}) {
    await new Promise((r) => setTimeout(r, 40));
    if (!courseId) return [];

    let topics = db.where('forum_topics', { courseId });

    // Filtro por Seção do Curso
    if (sectionId && sectionId !== 'all') {
      if (sectionId === 'general') {
        topics = topics.filter((t) => !t.sectionId);
      } else {
        topics = topics.filter((t) => t.sectionId === sectionId);
      }
    }

    // Filtro por Status: 'pending' (Pendente) | 'answered' (Respondido)
    if (status && status !== 'all') {
      topics = topics.filter((t) => t.status === status);
    }

    // Busca textual
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      topics = topics.filter((t) => {
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesContent = t.content?.toLowerCase().includes(q);
        const matchesAuthor = t.authorName?.toLowerCase().includes(q);
        const matchesTags = Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(q));
        return matchesTitle || matchesContent || matchesAuthor || matchesTags;
      });
    }

    // Ordenação: Fixados no topo, depois pela última atualização / criação
    return topics.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  },

  /**
   * Retorna um tópico com suas respostas completas
   */
  async getTopicById(topicId, incrementViews = false) {
    await new Promise((r) => setTimeout(r, 40));
    const topic = db.find('forum_topics', topicId);
    if (!topic) return null;

    if (incrementViews) {
      db.update('forum_topics', topicId, {
        views: (topic.views || 0) + 1
      });
      topic.views = (topic.views || 0) + 1;
    }

    const replies = db.where('forum_replies', { topicId });
    replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
      ...topic,
      replies
    };
  },

  /**
   * Cria uma nova dúvida / pergunta no fórum do curso
   */
  async createTopic({
    courseId,
    sectionId = null,
    sectionTitle = 'Geral',
    title,
    content,
    authorId,
    authorName,
    authorRole = 'aluno',
    tags = []
  }) {
    await new Promise((r) => setTimeout(r, 60));
    const now = new Date().toISOString();

    const newTopic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      courseId,
      sectionId: sectionId || null,
      sectionTitle: sectionTitle || 'Geral do Curso',
      title: title.trim(),
      content: content.trim(),
      authorId,
      authorName: authorName || 'Aluno',
      authorRole: authorRole || 'aluno',
      status: 'pending', // Inicia pendente de resposta
      tags: Array.isArray(tags) ? tags : [],
      createdAt: now,
      updatedAt: now,
      views: 1,
      repliesCount: 0,
      isPinned: false
    };

    db.create('forum_topics', newTopic);
    return newTopic;
  },

  /**
   * Adiciona uma resposta a uma dúvida
   */
  async addReply(topicId, {
    authorId,
    authorName,
    authorRole,
    content,
    isTeacherAnswer = false,
    markAsAnswered = false
  }) {
    await new Promise((r) => setTimeout(r, 60));
    const topic = db.find('forum_topics', topicId);
    if (!topic) throw new Error('Tópico não encontrado');

    const now = new Date().toISOString();
    const isDocente = authorRole === 'professor' || authorRole === 'admin' || isTeacherAnswer;

    const newReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      topicId,
      authorId,
      authorName,
      authorRole,
      content: content.trim(),
      isTeacherAnswer: isDocente,
      createdAt: now,
      upvotes: 0
    };

    db.create('forum_replies', newReply);

    // Atualiza contadores e status do tópico
    const newStatus = isDocente || markAsAnswered ? 'answered' : topic.status;
    const replies = db.where('forum_replies', { topicId });

    db.update('forum_topics', topicId, {
      updatedAt: now,
      repliesCount: replies.length,
      status: newStatus
    });

    return {
      reply: newReply,
      newStatus
    };
  },

  /**
   * Atualiza o status do tópico (pendente vs respondido)
   */
  async updateTopicStatus(topicId, status) {
    await new Promise((r) => setTimeout(r, 40));
    const updated = db.update('forum_topics', topicId, {
      status,
      updatedAt: new Date().toISOString()
    });
    return updated;
  },

  /**
   * Fixa/Desafixa tópico no topo (Professor/Admin)
   */
  async togglePinTopic(topicId) {
    await new Promise((r) => setTimeout(r, 40));
    const topic = db.find('forum_topics', topicId);
    if (!topic) return null;

    const updated = db.update('forum_topics', topicId, {
      isPinned: !topic.isPinned,
      updatedAt: new Date().toISOString()
    });
    return updated;
  },

  /**
   * Exclui um tópico e todas as suas respostas
   */
  async deleteTopic(topicId) {
    await new Promise((r) => setTimeout(r, 50));
    const replies = db.where('forum_replies', { topicId });
    replies.forEach((rep) => {
      db.delete('forum_replies', rep.id);
    });
    return db.delete('forum_topics', topicId);
  },

  /**
   * Exclui uma resposta específica
   */
  async deleteReply(topicId, replyId) {
    await new Promise((r) => setTimeout(r, 50));
    db.delete('forum_replies', replyId);
    const replies = db.where('forum_replies', { topicId });
    db.update('forum_topics', topicId, {
      repliesCount: replies.length,
      updatedAt: new Date().toISOString()
    });
    return true;
  },

  /**
   * Voto útil / curtida em uma resposta
   */
  async upvoteReply(replyId) {
    await new Promise((r) => setTimeout(r, 30));
    const reply = db.find('forum_replies', replyId);
    if (!reply) return null;
    const upvotes = (reply.upvotes || 0) + 1;
    return db.update('forum_replies', replyId, { upvotes });
  }
};




