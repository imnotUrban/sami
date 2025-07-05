-- ========================================
-- Script para crear usuario administrador
-- ========================================

-- Crear el usuario administrador si no existe
DO $$
DECLARE
    existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count FROM users WHERE email = 'admin@sami.local';
    
    IF existing_count = 0 THEN
        INSERT INTO users (name, email, password_hash, role, status)
        VALUES (
            'Administrator',
            'admin@sami.local',
            crypt('admin123', gen_salt('bf')),
            'admin',
            'active'
        );
        RAISE NOTICE 'Usuario administrador creado: admin@sami.local / admin123';
    ELSE
        RAISE NOTICE 'Usuario administrador ya existe';
    END IF;
END $$;

-- Verificar que el usuario fue creado
SELECT 
    id,
    name,
    email,
    role,
    status,
    created_at
FROM users 
WHERE email = 'admin@sami.local'; 