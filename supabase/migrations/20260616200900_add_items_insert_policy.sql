-- Permitir insert em items
CREATE POLICY "Users can insert items" ON items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir insert e delete explícito em character_items
DROP POLICY IF EXISTS "Users can manage their own character items" ON character_items;

CREATE POLICY "Users can manage their own character items" ON character_items
    FOR ALL USING (
        auth.role() = 'authenticated'
    ) WITH CHECK (
        auth.role() = 'authenticated'
    );
