import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import {installNameVoice} from './utils/nameVoice';

registerSW({immediate: true});
installNameVoice();

createRoot(document.getElementById('root')!).render(<App />);
