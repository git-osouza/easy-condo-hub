import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Unit {
  id: string;
  unit_label: string;
}

export default function RegisterDelivery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: '',
    obs: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('id, unit_label')
      .order('unit_label');
    
    if (!error && data) {
      setUnits(data);
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
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
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
    setLoading(true);

    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      const { error } = await supabase.from('deliveries').insert({
        unit_id: formData.unit_id,
        obs: formData.obs,
        photo_url: photoUrl,
        created_by_user_id: user?.id,
      });

      if (error) throw error;

      await supabase.functions.invoke('send-delivery-notification', {
        body: { unit_id: formData.unit_id }
      });

      toast.success('Entrega registrada com sucesso!');
      navigate(-1);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao registrar entrega');
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
            <CardTitle>Registrar Nova Entrega</CardTitle>
            <CardDescription>
              Registre uma nova encomenda que chegou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade *</Label>
                <Select 
                  value={formData.unit_id} 
                  onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  placeholder="Detalhes sobre a entrega (opcional)"
                  value={formData.obs}
                  onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto da Entrega</Label>
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
                  disabled={loading || !formData.unit_id}
                >
                  {loading ? 'Salvando...' : 'Salvar e Notificar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
