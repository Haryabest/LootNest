-- Проверяем, что бакет для аватаров существует
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('avatars', 'avatars', true, false)
ON CONFLICT (id) DO NOTHING;

-- Удаляем старые политики для избежания конфликтов
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Создаем политику для публичного доступа на чтение аватаров
CREATE POLICY "Public Access to Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Разрешаем аутентифицированным пользователям загружать аватары
-- ВАЖНО: userId должен быть первой частью пути
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Разрешаем пользователям обновлять только свои аватары
-- ВАЖНО: userId должен быть первой частью пути
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Разрешаем пользователям удалять только свои аватары
-- ВАЖНО: userId должен быть первой частью пути
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Исправляем URL аватаров в профилях, если они содержат дублирование путей
UPDATE profiles 
SET avatar_url = REPLACE(avatar_url, 'avatars/avatars/', 'avatars/')
WHERE avatar_url LIKE '%avatars/avatars/%';

-- Выводим список всех политик для проверки (без использования pg_get_expr)
SELECT
  policyname,
  tablename,
  cmd AS operation,
  permissive
FROM
  pg_policies
WHERE
  tablename = 'objects' AND
  schemaname = 'storage';

-- Проверяем, что бакет существует и доступен
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Проверяем URL аватаров в профилях
SELECT id, avatar_url FROM profiles WHERE avatar_url IS NOT NULL;