import { AuthProvider } from '@/contexts/AuthContext';
import ViewManager from '@/components/ViewManager';

const Index = () => {
  return (
    <AuthProvider>
      <ViewManager />
    </AuthProvider>
  );
};

export default Index;
