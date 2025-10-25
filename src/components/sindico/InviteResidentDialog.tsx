import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Unit {
  id: string;
  unit_label: string;
}

interface InviteResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteResidentDialog({ open, onOpenChange }: InviteResidentDialogProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    unit_id: '',
  });

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('id, unit_label')
      .order('unit_label');
    
    if (!error && data) {
      setUnits(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from('invite_tokens').insert({
        email: formData.email,
        token,
        expires_at: expiresAt.toISOString(),
        role: 'morador',
        unit_id: formData.unit_id,
      });

      if (error) throw error;

      toast.success('Convite criado! Token: ' + token);
      setFormData({ email: '', unit_id: '' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao criar convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (open) fetchUnits();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Morador</DialogTitle>
          <DialogDescription>
            Envie um convite por email para um novo morador
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Morador *</Label>
            <Input
              id="email"
              type="email"
              placeholder="morador@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unit_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
