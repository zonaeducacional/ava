/**
 * Serviço de Notificações por Navegador (Web Push via Service Worker)
 * Gerencia o registro do Service Worker (/sw.js), permissões do navegador (Notification API)
 * e o envio de notificações em segundo plano para Alunos e Professores.
 */

class WebPushService {
  constructor() {
    this.registration = null;
    this.init();
  }

  isSupported() {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window
    );
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }

  async init() {
    if (!this.isSupported()) return null;
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      return this.registration;
    } catch (err) {
      console.warn('Service Worker não pôde ser registrado:', err);
      return null;
    }
  }

  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Notificações não são suportadas neste navegador.');
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await this.init();
    }
    return permission;
  }

  /**
   * Dispara uma notificação utilizando o Service Worker
   * @param {Object} options
   * @param {string} options.title Título da notificação
   * @param {string} options.body Conteúdo / mensagem
   * @param {string} options.url URL para redirecionar ao clicar
   * @param {string} options.tag Tag para agrupar
   * @param {number} options.delayMs Atraso opcional em ms para testar fora da aba
   */
  async sendNotification({
    title = 'Mini Moodle LMS',
    body = 'Você tem uma nova notificação acadêmica.',
    url = '/',
    tag = 'lms-notif',
    delayMs = 0
  }) {
    if (!this.isSupported()) return false;

    // Se a permissão não foi concedida ainda, solicita
    if (Notification.permission !== 'granted') {
      const perm = await this.requestPermission();
      if (perm !== 'granted') {
        return false;
      }
    }

    const trigger = async () => {
      try {
        const reg = this.registration || (await navigator.serviceWorker.ready);

        const notificationOptions = {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `${tag}-${Date.now()}`,
          renotify: true,
          vibrate: [200, 100, 200],
          data: { url }
        };

        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, notificationOptions);
        } else if (reg && reg.active) {
          reg.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options: notificationOptions
          });
        } else {
          // Fallback para Notification API direta
          new Notification(title, notificationOptions);
        }
        return true;
      } catch (err) {
        console.error('Erro ao disparar notificação via Service Worker:', err);
        return false;
      }
    };

    if (delayMs > 0) {
      setTimeout(trigger, delayMs);
      return true;
    }

    return trigger();
  }

  // Notificações temáticas pré-formatadas para o LMS

  notifyNewAssignment({ courseTitle, assignmentTitle, dueDate, courseId }) {
    return this.sendNotification({
      title: `📝 Nova Atividade: ${courseTitle}`,
      body: `"${assignmentTitle}" já está disponível.${dueDate ? ` Prazo de entrega: ${dueDate}.` : ''} Clique para acessar.`,
      url: `/courses/${courseId}`,
      tag: 'new-assignment'
    });
  }

  notifyGradePublished({ courseTitle, assignmentTitle, score, maxScore, courseId }) {
    return this.sendNotification({
      title: `🎯 Nota Lançada: ${assignmentTitle}`,
      body: `Sua atividade em ${courseTitle} foi avaliada! Nota: ${score}/${maxScore}. Clique para conferir o feedback.`,
      url: `/grades?courseId=${courseId}`,
      tag: 'grade-published'
    });
  }

  notifySubmissionReceived({ courseTitle, studentName, assignmentTitle, courseId }) {
    return this.sendNotification({
      title: `📥 Nova Entrega de Aluno`,
      body: `${studentName} enviou a atividade "${assignmentTitle}" em ${courseTitle}. Aguardando sua correção.`,
      url: `/grades?courseId=${courseId}`,
      tag: 'submission-received'
    });
  }

  notifyLiveClassStarted({ courseTitle, teacherName, courseId }) {
    return this.sendNotification({
      title: `🔴 Aula ao Vivo Iniciada!`,
      body: `${teacherName} acabou de abrir a sala de aula virtual em ${courseTitle}. Entre agora para participar!`,
      url: `/courses/${courseId}`,
      tag: 'live-class'
    });
  }

  notifyNewDiscussionText({ courseTitle, textTitle, authorName, courseId }) {
    return this.sendNotification({
      title: `📖 Nova Leitura & Debate: ${courseTitle}`,
      body: `${authorName} publicou "${textTitle}". Participe das discussões e leia na íntegra.`,
      url: `/courses/${courseId}`,
      tag: 'discussion-text'
    });
  }
}

export const webPushService = new WebPushService();
