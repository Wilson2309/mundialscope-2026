create extension if not exists pgcrypto;

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric not null,
  duration integer not null,
  description text,
  icon text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  specialty text not null,
  experience text,
  skills text[] not null,
  schedule_start time default '09:00',
  schedule_end time default '18:00',
  active boolean default true,
  avatar text,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  client_name text not null,
  phone text not null,
  email text,
  staff_id uuid references staff(id),
  staff_name text not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  total_price numeric not null,
  total_duration integer not null,
  status text default 'confirmed',
  created_at timestamptz default now()
);

create table if not exists appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade,
  service_id uuid references services(id),
  service_name text not null,
  price numeric not null,
  duration integer not null,
  category text not null
);

create index if not exists idx_appointments_code on appointments(code);
create index if not exists idx_appointments_phone on appointments(phone);
create index if not exists idx_appointments_date_staff on appointments(appointment_date, staff_id);

insert into services (name, category, price, duration, description, icon) values
('Corte clásico', 'corte', 5, 30, 'Corte tradicional con acabado limpio para uso diario.', 'CC'),
('Corte degradado', 'corte', 7, 45, 'Fade moderno con líneas definidas y estilo actual.', 'DG'),
('Corte con tijera', 'corte', 8, 45, 'Corte detallado con tijera para un acabado natural.', 'TJ'),
('Corte + barba', 'combo', 10, 60, 'Servicio completo de cabello y barba con perfilado.', 'CB'),
('Barba perfilada', 'barba', 4, 25, 'Perfilado preciso de barba con líneas limpias.', 'BP'),
('Afeitado tradicional', 'barba', 6, 30, 'Afeitado clásico con acabado suave y prolijo.', 'AT'),
('Diseño de cejas', 'cejas', 3, 20, 'Definición de cejas para complementar el corte.', 'CJ'),
('Limpieza facial masculina', 'facial', 8, 40, 'Limpieza facial rápida para piel fresca y cuidada.', 'LF'),
('Mascarilla facial', 'facial', 5, 25, 'Mascarilla para hidratar y mejorar la apariencia de la piel.', 'MF'),
('Manicure masculina', 'manos', 6, 35, 'Cuidado básico de manos con acabado masculino.', 'MM'),
('Cuidado de manos y uñas', 'manos', 8, 45, 'Tratamiento completo para manos y uñas limpias.', 'MU'),
('Tratamiento capilar', 'cabello', 9, 40, 'Cuidado capilar para fortalecer y mejorar el cabello.', 'TC')
on conflict do nothing;

insert into staff (name, role, specialty, experience, skills, avatar) values
('Gabriel', 'Barbero', 'Degradados y cortes modernos', '4 años', array['corte', 'combo', 'cejas'], 'G'),
('Luis', 'Barbero', 'Barba y corte clásico', '5 años', array['barba', 'corte', 'combo'], 'L'),
('Andrés', 'Barbero', 'Diseños y estilos juveniles', '3 años', array['corte', 'cejas', 'cabello'], 'A'),
('Mateo', 'Barbero', 'Corte con tijera y afeitado', '6 años', array['corte', 'barba', 'cabello'], 'M'),
('Valeria', 'Barbera', 'Limpieza facial masculina y cejas', '4 años', array['facial', 'cejas', 'manos'], 'V'),
('Camila', 'Barbera', 'Manicure masculina y cuidado facial', '3 años', array['manos', 'facial', 'cejas'], 'C'),
('Bryan', 'Barbero', 'Degradados, diseños y tratamientos capilares', '5 años', array['corte', 'cabello', 'cejas'], 'B')
on conflict do nothing;
