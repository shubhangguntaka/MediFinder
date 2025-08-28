
import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import UserView from './components/UserView';
import AuthorDashboard from './components/AuthorDashboard';
import Header from './components/Header';
import WelcomePage from './components/WelcomePage';
import ProfilePage from './components/ProfilePage';
import Toast from './components/Toast';

const App: React.FC = () => {
  const { user } = useAuth();
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [view, setView] = useState<'main' | 'profile'>('main');
  
  const [hasStarted, setHasStarted] = useState(() => {
    // Check local storage on initial render
    return !!localStorage.getItem('medifind_has_started');
  });

  const handleGetStarted = () => {
    localStorage.setItem('medifind_has_started', 'true');
    setHasStarted(true);
  };
  
  const handleLogout = () => {
    setView('main'); // Reset to main view on logout
  };

  const renderContent = () => {
    if (!hasStarted) {
        return <WelcomePage onGetStarted={handleGetStarted} />;
    }

    if (isLoginVisible && !user) {
        return <LoginPage onClose={() => setIsLoginVisible(false)} />;
    }

    const renderMainView = () => {
        if (view === 'profile' && user) {
            return <ProfilePage onBack={() => setView('main')} />;
        }
        
        if (user?.role === 'author') {
            return <AuthorDashboard />;
        }
        
        return <UserView onLoginClick={() => setIsLoginVisible(true)} />;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-slate-900 dark:text-gray-200">
          <Header 
            onLoginClick={() => setIsLoginVisible(true)} 
            onProfileClick={() => setView('profile')}
            onLogout={handleLogout}
          />
          {renderMainView()}
        </div>
    );
  }

  return (
    <>
      <Toast />
      {renderContent()}
    </>
  );
};

export default App;
