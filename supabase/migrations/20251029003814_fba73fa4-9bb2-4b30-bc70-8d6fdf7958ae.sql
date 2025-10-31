-- Criar função para vincular morador à unidade após signup via convite
CREATE OR REPLACE FUNCTION public.link_resident_to_unit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  user_email TEXT;
BEGIN
  -- Buscar o email do usuário na tabela auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Buscar convite pelo email do novo usuário
  SELECT * INTO invite_record
  FROM invite_tokens
  WHERE email = user_email
    AND role = 'morador'
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record.id IS NOT NULL THEN
    -- Criar vínculo na tabela unit_profiles usando o profile.id (NEW.id)
    INSERT INTO unit_profiles (profile_id, unit_id, type, active)
    SELECT NEW.id, invite_record.unit_id, 'proprietario', true
    WHERE NOT EXISTS (
      SELECT 1 FROM unit_profiles 
      WHERE profile_id = NEW.id AND unit_id = invite_record.unit_id
    );

    -- Marcar convite como usado
    UPDATE invite_tokens
    SET used = true
    WHERE id = invite_record.id;

    RAISE LOG 'Morador % vinculado à unidade %', NEW.id, invite_record.unit_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para executar após inserção de profile de morador
DROP TRIGGER IF EXISTS on_morador_profile_created ON public.profiles;
CREATE TRIGGER on_morador_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'morador')
  EXECUTE FUNCTION public.link_resident_to_unit();