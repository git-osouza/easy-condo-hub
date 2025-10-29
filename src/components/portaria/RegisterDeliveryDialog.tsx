import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Unit {
  id: string;
  unit_label: string;
}

interface RegisterDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function RegisterDeliveryDialog({ open, onOpenChange, onSuccess }: RegisterDeliveryDialogProps) {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: '',
    obs: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `deliveries/${fileName}`;

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
    if (!formData.unit_id) {
      toast.error('Selecione uma unidade');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          unit_id: formData.unit_id,
          obs: formData.obs || null,
          photo_url: photoUrl,
          created_by_user_id: user?.id,
          status: 'aguardando',
        })
        .select('id, unit_id')
        .single();

      if (error) throw error;

      // Buscar info da unidade para enviar notificação
      const { data: unit } = await supabase
        .from('units')
        .select('unit_label')
        .eq('id', formData.unit_id)
        .single();

      // Enviar notificação via edge function
      try {
        await supabase.functions.invoke('send-delivery-notification', {
          body: {
            delivery_id: delivery.id,
            unit_id: delivery.unit_id,
            unit_label: unit?.unit_label || 'Unidade',
            obs: formData.obs
          }
        });
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Não bloquear o registro se falhar a notificação
      }

      toast.success('Entrega registrada e morador notificado!');
      setFormData({ unit_id: '', obs: '' });
      setPhoto(null);
      setPhotoPreview(null);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao registrar entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (open) fetchUnits();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nova Entrega</DialogTitle>
          <DialogDescription>
            Registre uma nova encomenda recebida na portaria
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
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
            <Label htmlFor="obs">Observação</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['1 objeto', '2 objetos', '3 objetos', '4 objetos', '5 objetos', 'Caixa grande', 'Envelope'].map((opt) => (
                <Button
                  key={opt}
                  type="button"
                  variant={formData.obs === opt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, obs: opt })}
                >
                  {opt}
                </Button>
              ))}
            </div>
            <Textarea
              id="obs"
              placeholder="Ou digite uma observação personalizada..."
              value={formData.obs}
              onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto da Entrega</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Câmera
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mt-2" />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar & Notificar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
