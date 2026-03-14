import { useState, useEffect } from 'react';
import { useStorage } from './hooks/useStorage';
import Auth from './components/Auth';
import Home from './components/Home';
import Levels from './components/Levels';
import Cards from './components/Cards';
import Quiz from './components/Quiz';
import Review from './components/Review';
import DialogueTrainer from './components/DialogueTrainer';
import GlueTrainer from './components/GlueTrainer';
import LevelExam from './components/LevelExam';
import Welcome from './components/Welcome';
import Settings from './components/Settings';
import IslandView from './components/IslandView';
import { sfx } from './utils/sfx';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const store = useStorage();
  const { 
    user, data, initialized, setUser, update, 
    isLoggedIn, isLoaded
  } = store;

  const [screen, setScreen] = useState('home');
  const [params, setParams] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [setUser]);

  // 2. Sync Firebase name
  useEffect(() => {
    try {
      if (user && data?.username !== undefined) {
        const firebaseName = user.displayName;
        const currentName = data.username;
        const fallback = user.email || user.phoneNumber || 'User';
        const finalName = firebaseName || currentName || fallback;
        if (currentName !== finalName) update({ username: finalName });
      }
    } catch (err) {}
  }, [user, data?.username, update]);

  // 3. Theme
  useEffect(() => {
    const theme = data?.currentTheme || 'default';
    const body = document.body;
    body.className = body.className.replace(/\btheme-\S+/g, '');
    if (theme !== 'default') body.classList.add(`theme-${theme}`);
  }, [data?.currentTheme]);

  if (loading || !initialized) return null;

  if (user && !isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontWeight: 600 }}>
        Загрузка данных...
      </div>
    );
  }

  const go = (s, p) => { 
    sfx.click();
    setScreen(s); 
    if (p !== undefined) setParams(p); 
  };

  if (!data?.onboardingDone) return <Welcome store={store} go={go} />;
  if (!isLoggedIn) return <Auth store={store} />;

  const props = { store, go };
  const getComponent = () => {
    switch (screen) {
      case 'levels': return <Levels {...props} level={params} />;
      case 'cards': return <Cards {...props} level={params} />;
      case 'quiz': return <Quiz store={store} go={go} level={params?.level} type={params?.type} />;
      case 'review': return <Review store={store} go={go} />;
      case 'dialogue': return <DialogueTrainer store={store} go={go} />;
      case 'glue': return <GlueTrainer store={store} go={go} />;
      case 'exam': return <LevelExam store={store} go={go} level={params?.level} />;
      case 'settings': return <Settings {...props} />;
      case 'islandView': return <IslandView {...props} level={params} />;
      default: return <Home {...props} />;
    }
  };

  return getComponent();
}
