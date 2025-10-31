import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ManageUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ManageUnitsDialog({ open, onOpenChange, onSuccess }: ManageUnitsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloco: '',
    andarInicio: 1,
    andarFim: 10,
    unidadesPorAndar: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const units = [];
      for (let andar = formData.andarInicio; andar <= formData.andarFim; andar++) {
        for (let unidade = 1; unidade <= formData.unidadesPorAndar; unidade++) {
          const numero = parseInt(`${andar}${unidade.toString().padStart(2, '0')}`);
          units.push({
            bloco: formData.bloco || null,
            andar,
            numero,
            unit_label: formData.bloco 
              ? `Bloco ${formData.bloco} - ${numero}`
              : `Unidade ${numero}`,
          });
        }
      }

      const { error } = await supabase.from('units').insert(units);
      if (error) throw error;

      toast.success(`${units.length} unidades cadastradas com sucesso!`);
      setFormData({ bloco: '', andarInicio: 1, andarFim: 10, unidadesPorAndar: 4 });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar unidades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Unidades em Lote</DialogTitle>
          <DialogDescription>
            Configure a estrutura de blocos, andares e unidades
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bloco">Bloco (opcional)</Label>
            <Input
              id="bloco"
              type="text"
              placeholder="Ex: A, B, C..."
              value={formData.bloco}
              onChange={(e) => setFormData({ ...formData, bloco: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="andarInicio">Andar Inicial</Label>
              <Input
                id="andarInicio"
                type="number"
                min="1"
                value={formData.andarInicio}
                onChange={(e) => setFormData({ ...formData, andarInicio: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="andarFim">Andar Final</Label>
              <Input
                id="andarFim"
                type="number"
                min="1"
                value={formData.andarFim}
                onChange={(e) => setFormData({ ...formData, andarFim: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidadesPorAndar">Unidades por Andar</Label>
            <Input
              id="unidadesPorAndar"
              type="number"
              min="1"
              max="20"
              value={formData.unidadesPorAndar}
              onChange={(e) => setFormData({ ...formData, unidadesPorAndar: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">Preview:</p>
            <p className="text-muted-foreground">
              Serão criadas {(formData.andarFim - formData.andarInicio + 1) * formData.unidadesPorAndar} unidades
              {formData.bloco && ` no Bloco ${formData.bloco}`}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Unidades'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
