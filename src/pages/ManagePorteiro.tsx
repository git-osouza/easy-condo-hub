import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagePorteiro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    password: '',
  });

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setFormData({ ...formData, password });
    toast.success('Senha gerada: ' + password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = `${formData.username}@portaria.easy`;
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const { error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'porteiro',
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;
      
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }

      toast.success(
        `Porteiro cadastrado!\nUsuário: ${formData.username}\nSenha: ${formData.password}`
      );
      navigate(-1);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar porteiro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Porteiro</CardTitle>
            <CardDescription>
              Crie um novo acesso para porteiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nome do porteiro"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="ederson.souza"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '.') })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Será usado para login (ex: ederson.souza)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    placeholder="Senha de acesso"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Gerar
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Porteiro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}