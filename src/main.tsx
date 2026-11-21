import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import {installNameVoice} from './utils/nameVoice';

// Планшет держит приложение открытым днями — проверяем новую версию при каждом возвращении в игру
// и раз в 15 минут; autoUpdate сам перезагрузит страницу, когда новая версия скачается.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
    window.setInterval(check, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    window.addEventListener('focus', check);
  },
});
installNameVoice();

createRoot(document.getElementById('root')!).render(<App />);
