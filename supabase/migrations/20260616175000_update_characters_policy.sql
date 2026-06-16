-- Update characters table to allow all authenticated users to view all characters
-- This is necessary for the session creation flow where a GM can select any character

-- First, we need to handle existing select policies if any. 
-- Since we don't know the exact name of the existing policy, we can add a new policy
-- Postgres policies are permissive by default and combine with OR.
-- Adding this policy will ensure everyone can see all characters, regardless of previous policies.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'characters' 
        AND policyname = 'Users can view all characters'
    ) THEN
        CREATE POLICY "Users can view all characters" 
        ON public.characters 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;
