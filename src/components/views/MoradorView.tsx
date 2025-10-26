import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import NotificationSettings from '@/components/morador/NotificationSettings';

interface Delivery {
  id: string;
  photo_url: string | null;
  obs: string | null;
  status: 'aguardando' | 'retirada';
  created_at: string;
  picked_up_at: string | null;
  picked_up_by_name: string | null;
}

interface Notification {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
}

export default function MoradorView() {
  const { user, profile } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const { data: unitProfiles } = await supabase
        .from('unit_profiles')
        .select('unit_id')
        .eq('profile_id', profile?.id);

      if (unitProfiles && unitProfiles.length > 0) {
        const unitIds = unitProfiles.map(up => up.unit_id);

        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('deliveries')
          .select('*')
          .in('unit_id', unitIds)
          .order('created_at', { ascending: false });

        if (deliveriesError) throw deliveriesError;
        setDeliveries(deliveriesData || []);
      }

      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const pendingDeliveries = deliveries.filter(d => d.status === 'aguardando');
  const unreadNotifications = notifications.filter(n => !n.read_at);

  return (
    <div className="space-y-6">
      <NotificationSettings />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Aguardando Retirada</span>
              <Package className="h-6 w-6 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-warning">{pendingDeliveries.length}</p>
              <p className="text-sm text-muted-foreground">entregas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Total de Entregas</span>
              <CheckCircle2 className="h-6 w-6 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{deliveries.length}</p>
              <p className="text-sm text-muted-foreground">registradas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-info/50 bg-info/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Notificações</span>
              <Bell className="h-6 w-6 text-info" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-info">{unreadNotifications.length}</p>
              <p className="text-sm text-muted-foreground">não lidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Minhas Entregas</CardTitle>
            <CardDescription>Histórico de encomendas da sua unidade</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma entrega registrada</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    {delivery.photo_url && (
                      <img
                        src={delivery.photo_url}
                        alt="Entrega"
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={delivery.status === 'aguardando' ? 'default' : 'secondary'}>
                          {delivery.status === 'aguardando' ? 'Aguardando' : 'Retirada'}
                        </Badge>
                      </div>
                      {delivery.obs && (
                        <p className="text-sm text-foreground mb-1">{delivery.obs}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Recebida: {new Date(delivery.created_at).toLocaleString('pt-BR')}
                      </p>
                      {delivery.picked_up_at && (
                        <p className="text-xs text-success mt-1">
                          Retirada: {new Date(delivery.picked_up_at).toLocaleString('pt-BR')}
                          {delivery.picked_up_by_name && ` por ${delivery.picked_up_by_name}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Central de Notificações</CardTitle>
            <CardDescription>Atualizações sobre suas entregas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.read_at
                        ? 'border-border bg-muted/30'
                        : 'border-info/50 bg-info/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Bell className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        notification.read_at ? 'text-muted-foreground' : 'text-info'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        {notification.body && (
                          <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
