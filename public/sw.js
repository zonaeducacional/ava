/**
 * Service Worker para Notificações Web Push do LMS
 * Permite receber alertas de novas atividades, prazos, notas e mensagens
 * mesmo quando a aba do aplicativo estiver em segundo plano ou fechada.
 */

const CACHE_NAME = 'lms-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Evento nativo de Push do navegador
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Mini Moodle LMS',
    body: 'Você recebeu uma nova atualização acadêmica.',
    url: '/'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || 'lms-alert',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// Evento disparado quando o usuário clica na notificação do sistema operacional / navegador
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver aba do LMS aberta, foca nela e navega para o link correto
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Se não houver janela aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Escuta mensagens do aplicativo React (ex: disparar notificação local via Service Worker)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});
