import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthView from './views/AuthView';
import MoradorView from './views/MoradorView';
import PortariaView from './views/PortariaView';
import SindicoView from './views/SindicoView';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

type ViewType = 'auth' | 'morador' | 'portaria' | 'sindico';

export default function ViewManager() {
  const { user, profile, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('auth');

  useEffect(() => {
    if (!loading && user && profile) {
      // Automatically set view based on user role
      if (profile.role === 'morador') {
        setCurrentView('morador');
      } else if (profile.role === 'porteiro') {
        setCurrentView('portaria');
      } else if (profile.role === 'sindico' || profile.role === 'admin') {
        setCurrentView('sindico');
      }
    } else if (!loading && !user) {
      setCurrentView('auth');
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="animate-pulse text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">EASY</h1>
            <p className="text-sm text-muted-foreground">Gestão para Portarias</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
            </div>
            <Button variant="outline" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {currentView === 'morador' && <MoradorView />}
        {currentView === 'portaria' && <PortariaView />}
        {currentView === 'sindico' && <SindicoView />}
      </main>
    </div>
  );
}
