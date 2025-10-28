import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface PickupDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: any;
  onSuccess: () => void;
}

export default function PickupDeliveryDialog({ open, onOpenChange, delivery, onSuccess }: PickupDeliveryDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pickedUpByName, setPickedUpByName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    const filePath = `pickups/${fileName}`;

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
    if (!pickedUpByName.trim()) {
      toast.error('Digite o nome de quem retirou');
      return;
    }
    if (!photo) {
      toast.error('Tire uma foto de quem está retirando');
      return;
    }

    setLoading(true);
    try {
      const photoUrl = await uploadPhoto(photo);

      const { error } = await supabase
        .from('deliveries')
        .update({
          status: 'retirada',
          picked_up_by_name: pickedUpByName,
          picked_up_at: new Date().toISOString(),
          pickup_photo_url: photoUrl,
        })
        .eq('id', delivery.id);

      if (error) throw error;

      toast.success('Retirada registrada com sucesso!');
      setPickedUpByName('');
      setPhoto(null);
      setPhotoPreview(null);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao registrar retirada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Retirada</DialogTitle>
          <DialogDescription>
            Confirme a retirada da encomenda
          </DialogDescription>
        </DialogHeader>
        {delivery && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="font-semibold">{delivery.units.unit_label}</p>
            {delivery.obs && <p className="text-sm text-muted-foreground">{delivery.obs}</p>}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickedUpBy">Nome de quem está retirando *</Label>
            <Input
              id="pickedUpBy"
              type="text"
              placeholder="Nome completo"
              value={pickedUpByName}
              onChange={(e) => setPickedUpByName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Foto de quem está retirando *</Label>
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
              capture="user"
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
              {loading ? 'Salvando...' : 'Confirmar Retirada'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
