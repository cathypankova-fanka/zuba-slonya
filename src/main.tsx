import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import {installNameVoice} from './utils/nameVoice';

// Планшет держит приложение открытым днями — проверяем новую версию только при возвращении в игру
// (не во время игры, чтобы страница не перезагрузилась посреди мини-игры).
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) reg.update().catch(() => {});
    });
  },
});
installNameVoice();

createRoot(document.getElementById('root')!).render(<App />);
