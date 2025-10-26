import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ManagePorteiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManagePorteiroDialog({ open, onOpenChange }: ManagePorteiroDialogProps) {
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
      
      // Get current session to restore later
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
      
      // Restore the current session (prevents auto-login)
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }

      toast.success(
        `Porteiro cadastrado!\nUsuário: ${formData.username}\nSenha: ${formData.password}`
      );
      setFormData({ fullName: '', username: '', phone: '', password: '' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar porteiro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Porteiro</DialogTitle>
          <DialogDescription>
            Crie um novo acesso para porteiro
          </DialogDescription>
        </DialogHeader>
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

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Porteiro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
