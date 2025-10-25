-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('morador', 'porteiro', 'sindico', 'admin');

-- Create enum for delivery status
CREATE TYPE delivery_status AS ENUM ('aguardando', 'retirada');

-- Create enum for unit profile type
CREATE TYPE unit_profile_type AS ENUM ('proprietario', 'locatario');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'morador',
  extra_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_login TIMESTAMPTZ
);

-- Create units table
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID,
  bloco TEXT,
  andar INTEGER,
  numero INTEGER NOT NULL,
  unit_label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create unit_profiles (vinculo morador ↔ unidade)
CREATE TABLE unit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type unit_profile_type NOT NULL DEFAULT 'proprietario',
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(unit_id, profile_id)
);

-- Create deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  photo_url TEXT,
  obs TEXT,
  status delivery_status DEFAULT 'aguardando' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  picked_up_at TIMESTAMPTZ,
  picked_up_by_name TEXT,
  pickup_photo_url TEXT
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data_json JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  push_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create subscriptions table (for web push)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create invite_tokens table
CREATE TABLE invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  role app_role NOT NULL,
  unit_id UUID REFERENCES units(id),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'morador')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Sindico can view all profiles"
  ON profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'sindico' OR public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for units
CREATE POLICY "Sindico can manage units"
  ON units FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('sindico', 'admin'));

CREATE POLICY "Porteiro can view units"
  ON units FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('porteiro', 'sindico', 'admin'));

CREATE POLICY "Morador can view their units"
  ON units FOR SELECT
  USING (
    id IN (
      SELECT unit_id FROM unit_profiles
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for unit_profiles
CREATE POLICY "Sindico can manage unit_profiles"
  ON unit_profiles FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('sindico', 'admin'));

CREATE POLICY "Morador can view their unit_profiles"
  ON unit_profiles FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for deliveries
CREATE POLICY "Porteiro can create deliveries"
  ON deliveries FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) IN ('porteiro', 'sindico', 'admin'));

CREATE POLICY "Porteiro can update deliveries"
  ON deliveries FOR UPDATE
  USING (public.get_user_role(auth.uid()) IN ('porteiro', 'sindico', 'admin'));

CREATE POLICY "Porteiro can view all deliveries"
  ON deliveries FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('porteiro', 'sindico', 'admin'));

CREATE POLICY "Morador can view their deliveries"
  ON deliveries FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM unit_profiles
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for audit_logs
CREATE POLICY "Sindico can view audit_logs"
  ON audit_logs FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('sindico', 'admin'));

CREATE POLICY "System can create audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for subscriptions
CREATE POLICY "Users can manage their subscriptions"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for invite_tokens
CREATE POLICY "Sindico can manage invites"
  ON invite_tokens FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('sindico', 'admin'));

-- Create storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT DO NOTHING;

-- Storage policies for delivery photos
CREATE POLICY "Porteiro can upload delivery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-photos' AND
    public.get_user_role(auth.uid()) IN ('porteiro', 'sindico', 'admin')
  );

CREATE POLICY "Anyone authenticated can view delivery photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Porteiro can update delivery photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'delivery-photos' AND
    public.get_user_role(auth.uid()) IN ('porteiro', 'sindico', 'admin')
  );