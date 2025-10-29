import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserX } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Morador {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
}

export default function RemoveMorador() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [selectedMoradorId, setSelectedMoradorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchMoradores();
  }, []);

  const fetchMoradores = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, phone')
      .eq('role', 'morador')
      .is('deleted_at', null)
      .order('full_name');

    if (!error && data) {
      setMoradores(data);
    }
  };

  const handleRemove = async () => {
    if (!selectedMoradorId) return;
    
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .eq('id', selectedMoradorId);

      if (updateError) throw updateError;

      const selectedMorador = moradores.find(m => m.id === selectedMoradorId);
      
      await supabase.from('audit_logs').insert({
        action: 'DELETE_MORADOR',
        table_name: 'profiles',
        record_id: selectedMoradorId,
        actor_user_id: user?.id,
        payload: {
          morador_name: selectedMorador?.full_name,
          morador_user_id: selectedMorador?.user_id,
        },
      });

      toast.success('Morador removido com sucesso!');
      navigate(-1);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao remover morador');
    } finally {
      setLoading(false);
      setShowConfirm(false);
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
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Remover Morador
            </CardTitle>
            <CardDescription>
              Remova o acesso de um morador do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {moradores.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum morador cadastrado</p>
                <Button onClick={() => navigate(-1)} className="mt-4">
                  Voltar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="morador">Selecione o Morador *</Label>
                  <Select value={selectedMoradorId} onValueChange={setSelectedMoradorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um morador" />
                    </SelectTrigger>
                    <SelectContent>
                      {moradores.map((morador) => (
                        <SelectItem key={morador.id} value={morador.id}>
                          {morador.full_name} {morador.phone && `- ${morador.phone}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <p className="text-sm text-destructive">
                    <strong>Atenção:</strong> Esta ação removerá o acesso do morador ao sistema. 
                    O registro será mantido no histórico para fins de auditoria.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1" 
                    disabled={!selectedMoradorId || loading}
                    onClick={() => setShowConfirm(true)}
                  >
                    Remover Morador
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este morador? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}