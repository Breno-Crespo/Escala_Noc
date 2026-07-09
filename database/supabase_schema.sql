-- Script de criação das tabelas para o Supabase
-- Cole este script no SQL Editor do seu painel do Supabase para configurar as tabelas necessárias automaticamente.

-- 1. Tabela de Perfis de Acesso
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    team TEXT NOT NULL,
    oncall TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) se desejado, ou deixar liberado para testes iniciais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total para simplificação de teste" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Inserir o perfil Administrador inicial
INSERT INTO public.profiles (id, name, username, role, team, oncall, password)
VALUES ('profile-row-admin-initial', 'Coordenador Admin', 'admin', 'coordenador', 'torre', 'nao', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 2. Tabela de Escala de Turnos NOC
CREATE TABLE IF NOT EXISTS public.shifts (
    id SERIAL PRIMARY KEY,
    employee_name TEXT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    day INT NOT NULL,
    shift TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_name, year, month, day)
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total para shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabela de Escala de Sobreaviso
CREATE TABLE IF NOT EXISTS public.sobreaviso (
    id SERIAL PRIMARY KEY,
    employee_name TEXT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    day INT NOT NULL,
    shift TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_name, year, month, day)
);

ALTER TABLE public.sobreaviso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total para sobreaviso" ON public.sobreaviso FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabela de Controle de Férias
CREATE TABLE IF NOT EXISTS public.vacations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    period TEXT NOT NULL,
    days INT NOT NULL,
    status TEXT NOT NULL,
    month TEXT NOT NULL,
    status_class TEXT NOT NULL,
    approved_by_admin BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total para vacations" ON public.vacations FOR ALL USING (true) WITH CHECK (true);

-- Inserir férias iniciais
INSERT INTO public.vacations (id, name, period, days, status, month, status_class, approved_by_admin)
VALUES 
    ('row-vac-felipe', 'Felipe Ribeiro', '01/07/2026 a 30/07/2026', 30, 'Em Férias Ativas', '7', 'status-ferias', true),
    ('row-vac-eduardo-l', 'Eduardo Leite (Supervisor)', '01/07/2026 a 30/07/2026', 30, 'Em Férias Ativas', '7', 'status-ferias', true),
    ('row-vac-eduardo-p', 'Eduardo Pereira', '13/07/2026 a 31/07/2026', 19, 'Aguardando Coordenador', '7', 'status-importing', null),
    ('row-vac-maxwel', 'Maxwel Dantas', '01/08/2026 a 15/08/2026', 15, 'Férias Aprovadas', '8', 'status-ready', true),
    ('row-vac-pedro', 'Pedro', '10/08/2026 a 24/08/2026', 15, 'Aguardando Coordenador', '8', 'status-importing', null),
    ('row-vac-bruno', 'Bruno Landra (Supervisor)', '01/11/2026 a 30/11/2026', 30, 'Planejada', '11', 'status-folga', true)
ON CONFLICT (id) DO NOTHING;
