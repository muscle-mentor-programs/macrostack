UPDATE public.profiles SET name = 'Branden Hales' WHERE id = '56c639d0-e97e-4826-86dd-0889b8d3b675';
UPDATE public.profiles SET name = 'Grayson Hales' WHERE id = 'a61aab1c-d467-4047-a989-aecdd96a61c3';
INSERT INTO public.clients (profile_id, name, email, goal_calories, goal_protein, goal_carbs, goal_fat)
VALUES ('a61aab1c-d467-4047-a989-aecdd96a61c3', 'Grayson Hales', 'graysonhales0@gmail.com', 2000, 150, 200, 65)
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
