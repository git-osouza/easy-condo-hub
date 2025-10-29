import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthView from './views/AuthView';
import PortariaView from './views/PortariaView';
import MoradorView from './views/MoradorView';
import SindicoView from './views/SindicoView';
import { Button } from './ui/button';
import { Package, Home, Settings, LogOut } from 'lucide-react';

type ViewType = 'portaria' | 'morador' | 'sindico' | 'settings';

export default function ViewManager() {
  const { user, profile, loading, signOut } = useAuth();
  
  // Auto-select view based on user role
  const getDefaultView = (): ViewType => {
    if (!profile) return 'portaria';
    if (profile.role === 'porteiro') return 'portaria';
    if (profile.role === 'morador') return 'morador';
    if (profile.role === 'sindico') return 'sindico';
    return 'portaria';
  };
  
  const [currentView, setCurrentView] = useState<ViewType>(getDefaultView());

  // Update view when profile changes
  useEffect(() => {
    if (profile) {
      setCurrentView(getDefaultView());
    }
  }, [profile?.role]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthView />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'portaria':
        return <PortariaView />;
      case 'morador':
        return <MoradorView />;
      case 'sindico':
        return <SindicoView />;
      default:
        return <PortariaView />;
    }
  };

  const getAvailableViews = () => {
    const views: { key: ViewType; label: string; icon: any }[] = [];
    
    if (profile.role === 'porteiro' || profile.role === 'admin') {
      views.push({ key: 'portaria', label: 'Portaria', icon: Package });
    }
    
    if (profile.role === 'morador' || profile.role === 'admin') {
      views.push({ key: 'morador', label: 'Minhas Entregas', icon: Home });
    }
    
    if (profile.role === 'sindico' || profile.role === 'admin') {
      views.push({ key: 'sindico', label: 'Gestão', icon: Settings });
    }
    
    return views;
  };

  const availableViews = getAvailableViews();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="bg-card border-b border-border shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                EASY
              </h1>
              <p className="text-sm text-muted-foreground">Gestão para Portarias</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-2">
            {availableViews.map((view) => {
              const Icon = view.icon;
              return (
                <Button
                  key={view.key}
                  variant={currentView === view.key ? 'default' : 'ghost'}
                  onClick={() => setCurrentView(view.key)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {view.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {renderView()}
      </main>
    </div>
  );
}
