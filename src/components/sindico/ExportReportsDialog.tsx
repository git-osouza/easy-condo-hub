import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';

interface ExportReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportReportsDialog({ open, onOpenChange }: ExportReportsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportDeliveries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('deliveries')
        .select(`
          id,
          created_at,
          status,
          obs,
          picked_up_at,
          picked_up_by_name,
          unit_id,
          created_by_user_id
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDateTime.toISOString());
      }

      const { data: deliveries, error } = await query;

      if (error) throw error;

      // Buscar dados relacionados
      const unitIds = [...new Set(deliveries?.map(d => d.unit_id) || [])];
      const userIds = [...new Set(deliveries?.map(d => d.created_by_user_id) || [])];

      const [unitsRes, profilesRes] = await Promise.all([
        supabase.from('units').select('id, unit_label, bloco, numero').in('id', unitIds),
        supabase.from('profiles').select('user_id, full_name').in('user_id', userIds)
      ]);

      const unitsMap = new Map(unitsRes.data?.map(u => [u.id, u]) || []);
      const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);

      const formattedData = deliveries?.map(d => {
        const unit = unitsMap.get(d.unit_id);
        const creator = profilesMap.get(d.created_by_user_id);
        return {
          'Data Registro': format(new Date(d.created_at), 'dd/MM/yyyy HH:mm'),
          'Unidade': unit?.unit_label || '',
          'Bloco': unit?.bloco || '',
          'Número': unit?.numero || '',
          'Status': d.status === 'aguardando' ? 'Aguardando' : 'Retirada',
          'Observação': d.obs || '',
          'Registrado por': creator?.full_name || '',
          'Retirado em': d.picked_up_at ? format(new Date(d.picked_up_at), 'dd/MM/yyyy HH:mm') : '',
          'Retirado por': d.picked_up_by_name || ''
        };
      }) || [];

      exportToCSV(formattedData, 'relatorio_entregas');
      toast.success('Relatório exportado com sucesso!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAudit = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          created_at,
          action,
          table_name,
          actor_user_id,
          payload
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDateTime.toISOString());
      }

      const { data: auditLogs, error } = await query;

      if (error) throw error;

      // Buscar perfis dos atores
      const userIds = [...new Set(auditLogs?.filter(a => a.actor_user_id).map(a => a.actor_user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const formattedData = auditLogs?.map(d => {
        const actor = d.actor_user_id ? profilesMap.get(d.actor_user_id) : null;
        return {
          'Data/Hora': format(new Date(d.created_at), 'dd/MM/yyyy HH:mm:ss'),
          'Usuário': actor?.full_name || 'Sistema',
          'Papel': actor?.role || 'Sistema',
          'Ação': d.action,
          'Tabela': d.table_name,
          'Detalhes': JSON.stringify(d.payload || {})
        };
      }) || [];

      exportToCSV(formattedData, 'relatorio_auditoria');
      toast.success('Log de auditoria exportado com sucesso!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao exportar auditoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar Relatórios</DialogTitle>
          <DialogDescription>
            Gere relatórios em formato CSV para análise
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="deliveries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliveries">Entregas</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="space-y-4">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date-deliveries">Data Início</Label>
                  <Input
                    id="start-date-deliveries"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date-deliveries">Data Fim</Label>
                  <Input
                    id="end-date-deliveries"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Relatório de Entregas
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporta todas as entregas registradas no período selecionado, incluindo dados da unidade, status, datas e responsáveis.
                </p>
                <Button
                  onClick={handleExportDeliveries}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Exportando...' : 'Exportar Entregas (CSV)'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date-audit">Data Início</Label>
                  <Input
                    id="start-date-audit"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date-audit">Data Fim</Label>
                  <Input
                    id="end-date-audit"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Log de Auditoria
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporta todas as ações registradas no sistema, incluindo quem fez, quando e qual foi a ação realizada. Útil para auditoria e compliance.
                </p>
                <Button
                  onClick={handleExportAudit}
                  disabled={loading}
                  variant="secondary"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Exportando...' : 'Exportar Auditoria (CSV)'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
