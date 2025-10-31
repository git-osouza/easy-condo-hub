-- Add soft delete columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Create index for better query performance on non-deleted records
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- Update profiles view policies to exclude deleted records
DROP POLICY IF EXISTS "Sindico can view all profiles" ON public.profiles;
CREATE POLICY "Sindico can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'sindico'::app_role OR get_user_role(auth.uid()) = 'admin'::app_role)
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Add policy to allow sindico to soft delete profiles
CREATE POLICY "Sindico can soft delete profiles"
ON public.profiles
FOR UPDATE
USING (get_user_role(auth.uid()) = 'sindico'::app_role OR get_user_role(auth.uid()) = 'admin'::app_role)
WITH CHECK (get_user_role(auth.uid()) = 'sindico'::app_role OR get_user_role(auth.uid()) = 'admin'::app_role);