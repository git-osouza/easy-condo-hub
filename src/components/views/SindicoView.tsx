import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Package, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function SindicoView() {
  const [stats, setStats] = useState({
    units: 0,
    profiles: 0,
    deliveries: 0,
    pendingDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [unitsRes, profilesRes, deliveriesRes] = await Promise.all([
        supabase.from('units').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('deliveries').select('id, status', { count: 'exact' }),
      ]);

      const pendingCount = deliveriesRes.data?.filter(d => d.status === 'aguardando').length || 0;

      setStats({
        units: unitsRes.count || 0,
        profiles: profilesRes.count || 0,
        deliveries: deliveriesRes.count || 0,
        pendingDeliveries: pendingCount,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Unidades</span>
              <Building2 className="h-6 w-6 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.units}</p>
            <p className="text-sm text-muted-foreground">cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Moradores</span>
              <Users className="h-6 w-6 text-info" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.profiles}</p>
            <p className="text-sm text-muted-foreground">cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Entregas Total</span>
              <Package className="h-6 w-6 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.deliveries}</p>
            <p className="text-sm text-muted-foreground">registradas</p>
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
            <p className="text-3xl font-bold text-warning">{stats.pendingDeliveries}</p>
            <p className="text-sm text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-primary text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cadastrar Unidades
            </CardTitle>
            <CardDescription className="text-white/90">
              Criar estrutura de blocos e apartamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              Gerenciar Unidades
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-success text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convidar Moradores
            </CardTitle>
            <CardDescription className="text-white/90">
              Enviar convites por email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              Criar Convites
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              Cadastrar Porteiros
            </CardTitle>
            <CardDescription>
              Gerenciar equipe da portaria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Gerenciar Porteiros
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios e Auditoria</CardTitle>
          <CardDescription>Acesso completo ao histórico de entregas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Relatório de Entregas por Período
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Exportar Dados (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Log de Auditoria
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
