import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ManageUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Unit {
  id: string;
  unit_label: string;
  bloco: string | null;
  andar: number | null;
  numero: number;
}

export default function ManageUnitsDialog({ open, onOpenChange }: ManageUnitsDialogProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloco: '',
    andar: '',
    numero: '',
  });

  useEffect(() => {
    if (open) {
      fetchUnits();
    }
  }, [open]);

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('unit_label');
    
    if (!error && data) {
      setUnits(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const unitLabel = formData.bloco 
        ? `Bloco ${formData.bloco} - Apto ${formData.numero}${formData.andar ? ` (Andar ${formData.andar})` : ''}`
        : `Apto ${formData.numero}${formData.andar ? ` (Andar ${formData.andar})` : ''}`;

      const { error } = await supabase.from('units').insert({
        bloco: formData.bloco || null,
        andar: formData.andar ? parseInt(formData.andar) : null,
        numero: parseInt(formData.numero),
        unit_label: unitLabel,
      });

      if (error) throw error;

      toast.success('Unidade cadastrada com sucesso!');
      setFormData({ bloco: '', andar: '', numero: '' });
      fetchUnits();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar unidade');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta unidade?')) return;

    try {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;

      toast.success('Unidade removida com sucesso!');
      fetchUnits();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao remover unidade');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Unidades</DialogTitle>
          <DialogDescription>
            Cadastre e gerencie as unidades do condomínio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloco">Bloco (opcional)</Label>
              <Input
                id="bloco"
                placeholder="A, B, C..."
                value={formData.bloco}
                onChange={(e) => setFormData({ ...formData, bloco: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="andar">Andar (opcional)</Label>
              <Input
                id="andar"
                type="number"
                placeholder="1, 2, 3..."
                value={formData.andar}
                onChange={(e) => setFormData({ ...formData, andar: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                type="number"
                placeholder="101, 102..."
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Cadastrando...' : 'Cadastrar Unidade'}
          </Button>
        </form>

        <div className="space-y-2">
          <h3 className="font-semibold">Unidades Cadastradas ({units.length})</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Andar</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unit_label}</TableCell>
                    <TableCell>{unit.bloco || '-'}</TableCell>
                    <TableCell>{unit.andar || '-'}</TableCell>
                    <TableCell>{unit.numero}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {units.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma unidade cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
