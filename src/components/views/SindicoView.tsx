import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Package, UserPlus, UserX, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ManageUnitsDialog from '@/components/sindico/ManageUnitsDialog';
import InviteResidentDialog from '@/components/sindico/InviteResidentDialog';
import ManagePorteiroDialog from '@/components/sindico/ManagePorteiroDialog';
import ExportReportsDialog from '@/components/sindico/ExportReportsDialog';

export default function SindicoView() {
  const [stats, setStats] = useState({
    units: 0,
    profiles: 0,
    deliveries: 0,
    pendingDeliveries: 0,
    porteiros: 0,
    moradoresAtivos: 0,
    moradoresAguardando: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Dialogs state
  const [unitsDialogOpen, setUnitsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [porteiroDialogOpen, setPorteiroDialogOpen] = useState(false);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [unitsRes, profilesRes, deliveriesRes, porteirosRes, moradoresRes, invitesRes] = await Promise.all([
        supabase.from('units').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('deliveries').select('id, status', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'porteiro').is('deleted_at', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'morador').is('deleted_at', null),
        supabase.from('invite_tokens').select('id', { count: 'exact', head: true }).eq('role', 'morador').eq('used', false)
      ]);

      const pendingCount = deliveriesRes.data?.filter(d => d.status === 'aguardando').length || 0;

      setStats({
        units: unitsRes.count || 0,
        profiles: profilesRes.count || 0,
        deliveries: deliveriesRes.count || 0,
        pendingDeliveries: pendingCount,
        porteiros: porteirosRes.count || 0,
        moradoresAtivos: moradoresRes.count || 0,
        moradoresAguardando: invitesRes.count || 0,
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
            <p className="text-3xl font-bold">{stats.moradoresAtivos}</p>
            <p className="text-sm text-muted-foreground">ativos</p>
            <p className="text-xs text-warning mt-1">{stats.moradoresAguardando} aguardando convite</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Porteiros</span>
              <Users className="h-6 w-6 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.porteiros}</p>
            <p className="text-sm text-muted-foreground">cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Entregas</span>
              <Package className="h-6 w-6 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.deliveries}</p>
            <p className="text-sm text-muted-foreground">total</p>
            <p className="text-xs text-warning mt-1">{stats.pendingDeliveries} pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Gestão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setUnitsDialogOpen(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Cadastrar Unidades
              </CardTitle>
              <CardDescription>Criar estrutura de blocos e apartamentos</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                Remover Unidades
              </CardTitle>
              <CardDescription>Desativar unidades do sistema</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setInviteDialogOpen(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-success" />
                Convidar Moradores
              </CardTitle>
              <CardDescription>Enviar convites por email</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                Remover Moradores
              </CardTitle>
              <CardDescription>Desativar acesso de moradores</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setPorteiroDialogOpen(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-info" />
                Cadastrar Porteiros
              </CardTitle>
              <CardDescription>Adicionar novos porteiros</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                Remover Porteiros
              </CardTitle>
              <CardDescription>Desativar acesso de porteiros</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Relatórios</h3>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReportsDialogOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatórios e Auditoria
            </CardTitle>
            <CardDescription>Exportar dados e logs do sistema</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <ManageUnitsDialog open={unitsDialogOpen} onOpenChange={setUnitsDialogOpen} />
      <InviteResidentDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
      <ManagePorteiroDialog open={porteiroDialogOpen} onOpenChange={setPorteiroDialogOpen} />
      <ExportReportsDialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen} />
    </div>
  );
}
