import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, [user]);

  const checkNotificationStatus = async () => {
    // Verificar se o navegador suporta notificações
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações');
      return;
    }

    // Verificar permissão do navegador
    const permission = Notification.permission;
    setHasPermission(permission === 'granted');

    // Verificar se já tem subscription no banco
    if (user) {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsSubscribed(!!data);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = async () => {
    setLoading(true);
    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast.error('Permissão de notificação negada');
        setLoading(false);
        return;
      }

      setHasPermission(true);

      // Registrar service worker se ainda não estiver
      const registration = await navigator.serviceWorker.ready;

      // Criar subscription (usando uma chave pública VAPID - você pode gerar uma em https://vapidkeys.com/)
      // Por enquanto vamos usar uma chave de exemplo, mas você deve gerar sua própria
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Salvar subscription no banco (deletar existente e criar nova)
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: user.id,
          subscription_json: subscription.toJSON() as any
        }]);

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Notificações ativadas com sucesso!');
      
      // Enviar notificação de teste
      new Notification('EASY - Notificações Ativadas', {
        body: 'Você receberá notificações quando houver novas entregas!',
        icon: '/icon-192x192.png',
        badge: '/app-icon.svg'
      });

    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      toast.error('Erro ao ativar notificações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remover do banco
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsSubscribed(false);
      setHasPermission(false);
      toast.success('Notificações desativadas');
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações');
    } finally {
      setLoading(false);
    }
  };

  if (!('Notification' in window)) {
    return null;
  }

  return (
    <Card className={isSubscribed ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <>
              <Check className="h-5 w-5 text-success" />
              <span>Notificações Ativadas</span>
            </>
          ) : (
            <>
              <Bell className="h-5 w-5 text-warning" />
              <span>Ativar Notificações</span>
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isSubscribed
            ? 'Você receberá notificações push quando houver novas entregas'
            : 'Receba alertas instantâneos quando uma nova entrega chegar'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4" />
              <span>Notificações push ativadas</span>
            </div>
            <Button
              variant="outline"
              onClick={unsubscribeFromPushNotifications}
              disabled={loading}
              className="w-full"
            >
              <BellOff className="h-4 w-4 mr-2" />
              {loading ? 'Desativando...' : 'Desativar Notificações'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>✓ Alertas em tempo real</p>
              <p>✓ Funciona mesmo com o app fechado</p>
              <p>✓ Notificações sobre entregas da sua unidade</p>
            </div>
            <Button
              onClick={subscribeToPushNotifications}
              disabled={loading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {loading ? 'Ativando...' : 'Ativar Notificações Push'}
            </Button>
            {!hasPermission && (
              <p className="text-xs text-muted-foreground text-center">
                Clique no botão acima e permita notificações no navegador
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
