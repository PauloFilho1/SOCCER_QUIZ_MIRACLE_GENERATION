import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { ResetPassword } from './components/ResetPassword';
import { Home } from './components/Home';
import { Quiz } from './components/Quiz';
import { Ranking } from './components/Ranking';
import { AdminPanel } from './components/AdminPanel';
import { analyticsService } from './services/analyticsService';

type Screen = 'login' | 'signup' | 'home' | 'quiz' | 'ranking' | 'admin' | 'reset';

function AppContent() {
  const { user, accessToken, loading, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [forceReset, setForceReset] = useState(false);

  useEffect(() => {
    // Detecta link de recuperação do Supabase (type=recovery no hash)
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setForceReset(true);
      setCurrentScreen('reset');
    }
  }, []);

  useEffect(() => {
    if (user) {
      analyticsService.identifyUser(user.id, { email: user.email, role: user.role });
    }
  }, [user]);

  if (loading || (user && !accessToken)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6CB860] via-[#5DA952] to-[#4F9844] flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (forceReset || currentScreen === 'reset') {
    return <ResetPassword onDone={() => { setForceReset(false); setCurrentScreen('login'); }} />;
  }

  if (!user) {
    if (currentScreen === 'signup') {
      return <SignUp onNavigateToLogin={() => setCurrentScreen('login')} />;
    }
    return <Login onNavigateToSignUp={() => setCurrentScreen('signup')} />;
  }

  const goHome = () => {
    setCurrentScreen('home');
    setSelectedQuizId(null);
  };

  if (currentScreen === 'home') {
    return <Home 
      onStartQuiz={(quizId) => { setSelectedQuizId(quizId); setCurrentScreen('quiz'); }}
      onRanking={() => setCurrentScreen('ranking')}
      onAdmin={() => setCurrentScreen('admin')}
    />;
  }

  if (currentScreen === 'quiz') {
    if (!selectedQuizId) {
      return <Home 
        onStartQuiz={(quizId) => { setSelectedQuizId(quizId); setCurrentScreen('quiz'); }}
        onRanking={() => setCurrentScreen('ranking')}
        onAdmin={() => setCurrentScreen('admin')}
      />;
    }
    return <Quiz quizId={selectedQuizId} onBack={goHome} />;
  }

  if (currentScreen === 'ranking') {
    return <Ranking onBack={goHome} />;
  }

  if (currentScreen === 'admin') {
    return <AdminPanel onBack={goHome} />;
  }

  return <Home onNavigate={setCurrentScreen} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent key="app-content" />
    </AuthProvider>
  );
}
