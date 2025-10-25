import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackagePlus, PackageCheck, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Delivery {
  id: string;
  unit_id: string;
  photo_url: string | null;
  obs: string | null;
  status: 'aguardando' | 'retirada';
  created_at: string;
  units: {
    unit_label: string;
  };
}

export default function PortariaView() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          units (
            unit_label
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = deliveries.filter(d => d.status === 'aguardando').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Registrar Entrega</span>
              <PackagePlus className="h-6 w-6" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/90">Nova encomenda chegou</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Registrar Retirada</span>
              <PackageCheck className="h-6 w-6" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/90">Confirmar recebimento</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Buscar</span>
              <Search className="h-6 w-6 text-info" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Buscar por unidade</p>
          </CardContent>
        </Card>

        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Pendentes</span>
              <Package className="h-6 w-6 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-warning">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">entregas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entregas Recentes</CardTitle>
          <CardDescription>Últimas 20 entregas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma entrega registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
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
                    <p className="font-semibold truncate">{delivery.units.unit_label}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
