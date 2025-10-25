import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface SearchDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDeliveryDialog({ open, onOpenChange }: SearchDeliveryDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          units (
            unit_label
          )
        `)
        .ilike('units.unit_label', `%${term}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buscar Entregas</DialogTitle>
          <DialogDescription>
            Pesquise por número ou bloco da unidade
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar unidade</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Ex: 101, Bloco A, etc."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  {delivery.photo_url && (
                    <img
                      src={delivery.photo_url}
                      alt="Entrega"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{delivery.units.unit_label}</p>
                    {delivery.obs && (
                      <p className="text-sm text-muted-foreground truncate">{delivery.obs}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(delivery.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={delivery.status === 'aguardando' ? 'default' : 'secondary'}>
                    {delivery.status === 'aguardando' ? 'Aguardando' : 'Retirada'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!loading && searchTerm && results.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma entrega encontrada
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
