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
    const check = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && !reg.installing) reg.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', check);
    // Новая версия качает сотни картинок; если сервер ответил ошибкой хоть на одну, установка срывается
    // (скачанное сохраняется). Раньше следующая попытка была только при следующем открытии игры —
    // и планшет мог днями сидеть на старой версии. Теперь докачиваем каждые 2 минуты, пока игра открыта.
    window.setInterval(check, 2 * 60 * 1000);
  },
});
installNameVoice();

// Картинка не загрузилась (GitHub Pages иногда отвечает 503, пока офлайн-кэш качает тысячи файлов) —
// пробуем ещё раз через паузу с меткой ?r=N (иначе браузер отдаёт ту же ошибку из памяти, не спрашивая сервер).
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) return;
  const n = Number(img.dataset.retry ?? 0);
  if (n >= 4) return;
  img.dataset.retry = String(n + 1);
  const u = new URL(img.src);
  u.searchParams.set('r', String(n + 1));
  window.setTimeout(() => { img.src = u.toString(); }, 1500 * (n + 1));
}, true);

createRoot(document.getElementById('root')!).render(<App />);
