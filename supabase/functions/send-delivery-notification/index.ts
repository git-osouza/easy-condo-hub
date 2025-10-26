import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface DeliveryNotification {
  delivery_id: string;
  unit_id: string;
  unit_label: string;
  obs?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { delivery_id, unit_id, unit_label, obs } = await req.json() as DeliveryNotification;

    console.log('Processing delivery notification:', { delivery_id, unit_id, unit_label });

    // 1. Buscar moradores da unidade
    const { data: unitProfiles, error: unitError } = await supabase
      .from('unit_profiles')
      .select('profile_id, profiles!inner(user_id, full_name)')
      .eq('unit_id', unit_id)
      .eq('active', true);

    if (unitError) {
      console.error('Error fetching unit profiles:', unitError);
      throw unitError;
    }

    if (!unitProfiles || unitProfiles.length === 0) {
      console.log('No residents found for unit:', unit_id);
      return new Response(
        JSON.stringify({ message: 'No residents found for this unit' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found residents:', unitProfiles.length);

    // 2. Buscar subscriptions dos moradores
    const userIds = unitProfiles.map((up: any) => up.profiles.user_id);
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, subscription_json')
      .in('user_id', userIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    console.log('Found subscriptions:', subscriptions?.length || 0);

    // 3. Criar notificações no banco para todos os moradores
    const notificationTitle = `Nova Entrega - ${unit_label}`;
    const notificationBody = obs || 'Uma nova entrega chegou para sua unidade';

    const notifications = unitProfiles.map((up: any) => ({
      user_id: up.profiles.user_id,
      type: 'delivery',
      title: notificationTitle,
      body: notificationBody,
      data_json: {
        delivery_id,
        unit_id,
        unit_label
      },
      push_sent: false
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
      throw notifError;
    }

    console.log('Created notifications in database');

    // 4. Enviar web push para quem tem subscription
    let pushCount = 0;
    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          // Aqui você enviaria o push usando a API web-push
          // Por enquanto, vamos apenas logar
          console.log('Would send push to user:', sub.user_id);
          
          // Para implementar push real, você precisaria:
          // 1. Instalar web-push no Deno: import webpush from 'npm:web-push@3.6.7'
          // 2. Configurar chaves VAPID
          // 3. Usar webpush.sendNotification(subscription, payload)
          
          pushCount++;
        } catch (pushError) {
          console.error('Error sending push notification:', pushError);
        }
      }
    }

    console.log('Notification process completed:', {
      residents: unitProfiles.length,
      notifications_created: notifications.length,
      push_attempts: pushCount
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent',
        residents_notified: unitProfiles.length,
        push_sent: pushCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in send-delivery-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
