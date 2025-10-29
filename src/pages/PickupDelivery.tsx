import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, ArrowLeft, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

export default function PickupDelivery() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [pickedUpBy, setPickedUpBy] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingDeliveries();
  }, []);

  const fetchPendingDeliveries = async () => {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        units (
          unit_label
        )
      `)
      .eq('status', 'aguardando')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDeliveries(data);
      if (data.length === 1) {
        setSelectedDeliveryId(data[0].id);
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `pickup-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('delivery-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('delivery-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickedUpBy.trim()) {
      toast.error('Por favor, informe quem está retirando');
      return;
    }

    if (!selectedDeliveryId) {
      toast.error('Selecione uma entrega');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      const { error } = await supabase
        .from('deliveries')
        .update({
          status: 'retirada',
          picked_up_by_name: pickedUpBy,
          picked_up_at: new Date().toISOString(),
          pickup_photo_url: photoUrl,
        })
        .eq('id', selectedDeliveryId);

      if (error) throw error;

      toast.success('Retirada registrada com sucesso!');
      navigate(-1);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao registrar retirada');
    } finally {
      setLoading(false);
    }
  };

  const selectedDelivery = deliveries.find(d => d.id === selectedDeliveryId);

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
            <CardTitle>Registrar Retirada de Entrega</CardTitle>
            <CardDescription>
              Confirme a retirada da encomenda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma entrega pendente</p>
                <Button onClick={() => navigate(-1)} className="mt-4">
                  Voltar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery">Entrega *</Label>
                  <Select 
                    value={selectedDeliveryId} 
                    onValueChange={setSelectedDeliveryId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveries.map((delivery) => (
                        <SelectItem key={delivery.id} value={delivery.id}>
                          {delivery.units.unit_label} - {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDelivery && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Unidade:</span>
                          <Badge>{selectedDelivery.units.unit_label}</Badge>
                        </div>
                        {selectedDelivery.obs && (
                          <div>
                            <span className="text-sm font-medium">Observações:</span>
                            <p className="text-sm text-muted-foreground mt-1">{selectedDelivery.obs}</p>
                          </div>
                        )}
                        {selectedDelivery.photo_url && (
                          <div>
                            <span className="text-sm font-medium">Foto da entrega:</span>
                            <img
                              src={selectedDelivery.photo_url}
                              alt="Entrega"
                              className="w-full h-48 object-cover rounded-lg mt-2"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="picked-up-by">Quem está retirando? *</Label>
                  <Input
                    id="picked-up-by"
                    placeholder="Nome completo"
                    value={pickedUpBy}
                    onChange={(e) => setPickedUpBy(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto de Comprovação</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('camera-input')?.click()}
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Câmera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-input')?.click()}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Arquivo
                    </Button>
                  </div>
                  <input
                    id="camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {photoPreview && (
                    <div className="mt-4">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading}
                  >
                    {loading ? 'Confirmando...' : 'Confirmar Retirada'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
