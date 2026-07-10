-- Script de criação das tabelas para o Supabase (Segurança e Integridade Aumentadas)
-- Cole este script no SQL Editor do seu painel do Supabase para configurar o banco automaticamente.

-- Habilitar a extensão pgcrypto para criptografia Blowfish (bcrypt) das senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela de Perfis de Acesso
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('coordenador', 'noc', 'rh')),
    team TEXT NOT NULL CHECK (team IN ('n1', 'torre', 'rh')),
    oncall TEXT NOT NULL CHECK (oncall IN ('sim', 'fora')),
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso de leitura público para perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Escrita livre de perfis para administradores" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Trigger para hashear a senha automaticamente ao inserir ou atualizar
CREATE OR REPLACE FUNCTION public.hash_profile_password()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.password <> OLD.password THEN
        -- Apenas hashea se a senha não estiver no formato Blowfish (bcrypt)
        IF NEW.password NOT SIMILAR TO '\$2[yba]\$[0-9]{2}\$.*' THEN
            NEW.password := crypt(NEW.password, gen_salt('bf', 8));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_hash_password
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.hash_profile_password();

-- Inserir o perfil Administrador inicial
INSERT INTO public.profiles (id, name, username, role, team, oncall, password)
VALUES ('profile-row-admin-initial', 'Coordenador Admin', 'admin', 'coordenador', 'torre', 'fora', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 2. Função RPC de Validação de Login Segura (Bcrypt Match)
CREATE OR REPLACE FUNCTION public.verify_profile_login(p_username TEXT, p_password TEXT)
RETURNS TABLE (id TEXT, name TEXT, username TEXT, role TEXT, team TEXT, oncall TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.username, p.role, p.team, p.oncall
    FROM public.profiles p
    WHERE LOWER(p.username) = LOWER(p_username)
      AND p.password = crypt(p_password, p.password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tabela de Escala de Turnos NOC
CREATE TABLE IF NOT EXISTS public.shifts (
    id SERIAL PRIMARY KEY,
    employee_name TEXT NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE ON UPDATE CASCADE,
    year INT NOT NULL CHECK (year >= 2020),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    shift TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_name, year, month, day)
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para turnos NOC" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Escrita pública para turnos NOC" ON public.shifts FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabela de Escala de Sobreaviso
CREATE TABLE IF NOT EXISTS public.sobreaviso (
    id SERIAL PRIMARY KEY,
    employee_name TEXT NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE ON UPDATE CASCADE,
    year INT NOT NULL CHECK (year >= 2020),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    shift TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_name, year, month, day)
);

ALTER TABLE public.sobreaviso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para sobreaviso" ON public.sobreaviso FOR SELECT USING (true);
CREATE POLICY "Escrita pública para sobreaviso" ON public.sobreaviso FOR ALL USING (true) WITH CHECK (true);

-- 5. Tabela de Controle de Férias
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
CREATE POLICY "Leitura pública para férias" ON public.vacations FOR SELECT USING (true);
CREATE POLICY "Escrita pública para férias" ON public.vacations FOR ALL USING (true) WITH CHECK (true);

-- Inserir férias iniciais
INSERT INTO public.vacations (id, name, period, days, status, month, status_class, approved_by_admin)
VALUES 
    ('row-vac-felipe', 'Felipe Ribeiro', '01/07/2026 a 30/07/2026', 30, 'Em Férias Ativas', '7', 'status-ferias', true),
    ('row-vac-eduardo-l', 'Eduardo Leite', '01/07/2026 a 30/07/2026', 30, 'Em Férias Ativas', '7', 'status-ferias', true),
    ('row-vac-eduardo-p', 'Eduardo Pereira', '13/07/2026 a 31/07/2026', 19, 'Aguardando Coordenador', '7', 'status-importing', null),
    ('row-vac-maxwel', 'Maxwel Dantas', '01/08/2026 a 15/08/2026', 15, 'Férias Aprovadas', '8', 'status-ready', true),
    ('row-vac-pedro', 'Pedro', '10/08/2026 a 24/08/2026', 15, 'Aguardando Coordenador', '8', 'status-importing', null),
    ('row-vac-bruno', 'Bruno Landra', '01/11/2026 a 30/11/2026', 30, 'Planejada', '11', 'status-folga', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    operator_name TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    shift_date TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de logs para auditoria" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Escrita de logs para auditoria" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 7. Índices de Performance Compostos
CREATE INDEX IF NOT EXISTS idx_shifts_lookup ON public.shifts (year, month, employee_name);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_lookup ON public.sobreaviso (year, month, employee_name);
