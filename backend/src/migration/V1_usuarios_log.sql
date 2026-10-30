-- V1: usuários, perfis de acesso (RF32–RF36) e histórico de ações (RF44)

CREATE TABLE IF NOT EXISTS public.usua_usuario (
    usua_id            SERIAL       PRIMARY KEY,
    usua_nome          VARCHAR(150) NOT NULL,
    usua_login         VARCHAR(50)  NOT NULL,
    usua_senha         VARCHAR(100) NOT NULL,
    usua_tipo_usuario  SMALLINT     NOT NULL DEFAULT 2, -- 1 = Administrador, 2 = Usuário comum
    usua_whatsapp      VARCHAR(15),                     -- apenas dígitos, com DDI e DDD; identifica o usuário no bot
    usua_ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    usua_criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    usua_atualizado_em TIMESTAMPTZ,
    CONSTRAINT usua_login_uk    UNIQUE (usua_login),
    CONSTRAINT usua_whatsapp_uk UNIQUE (usua_whatsapp),
    CONSTRAINT usua_tipo_ck     CHECK (usua_tipo_usuario IN (1, 2))
);

-- Usuários não são excluídos (apenas desativados), então o histórico sempre aponta para um usuário existente
CREATE TABLE IF NOT EXISTS public.log_acao (
    log_id          SERIAL       PRIMARY KEY,
    log_usua_id     INTEGER      REFERENCES public.usua_usuario (usua_id),
    log_acao        VARCHAR(100) NOT NULL,
    log_entidade    VARCHAR(50),  -- ex.: 'usuario', 'estufa', 'especie'
    log_entidade_id INTEGER,
    log_descricao   TEXT,
    log_ip          VARCHAR(45),
    log_criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS log_acao_entidade_idx ON public.log_acao (log_entidade, log_entidade_id);
CREATE INDEX IF NOT EXISTS log_acao_usua_idx     ON public.log_acao (log_usua_id);

-- Administrador inicial. Usuário: admin / senha: admin123 — TROQUE A SENHA após o primeiro acesso.
INSERT INTO public.usua_usuario (usua_nome, usua_login, usua_senha, usua_tipo_usuario)
VALUES ('Administrador', 'admin', '$2b$12$gkOw8dhyChmGQrFNG9JAY./qdvmDsj3.Hrz7L4W6mtG.8Ue.B3S/W', 1)
ON CONFLICT (usua_login) DO NOTHING;
