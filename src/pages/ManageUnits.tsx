import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageUnits() {
  const navigate = useNavigate();
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
      navigate(-1);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar unidades');
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
            <CardTitle>Cadastrar Unidades em Lote</CardTitle>
            <CardDescription>
              Configure a estrutura de blocos, andares e unidades
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Unidades'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}