-- V3: espécies (RF08, RF09, RF11, RF14, RF15)

CREATE TABLE IF NOT EXISTS public.espe_especie (
    espe_id              SERIAL       PRIMARY KEY,
    espe_nome_popular    VARCHAR(150) NOT NULL,                  -- RF08 (obrigatório)
    espe_nome_cientifico VARCHAR(150),
    espe_familia         VARCHAR(100),
    espe_observacoes     TEXT,
    espe_ativo           BOOLEAN      NOT NULL DEFAULT TRUE,     -- false = desativada por ter semeaduras (RF15)
    espe_criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    espe_atualizado_em   TIMESTAMPTZ,
    CONSTRAINT espe_nome_popular_ck    CHECK (BTRIM(espe_nome_popular) <> ''),
    -- Opcionais: NULL quando não informados, nunca texto vazio
    CONSTRAINT espe_nome_cientifico_ck CHECK (BTRIM(espe_nome_cientifico) <> ''),
    CONSTRAINT espe_familia_ck         CHECK (BTRIM(espe_familia) <> ''),
    CONSTRAINT espe_observacoes_ck     CHECK (BTRIM(espe_observacoes) <> '' AND CHAR_LENGTH(espe_observacoes) <= 5000)
);

-- Nome popular único (sem diferenciar maiúsculas) entre as espécies ativas.
-- Uma espécie desativada não impede reutilizar o nome.
CREATE UNIQUE INDEX IF NOT EXISTS espe_nome_popular_uk
    ON public.espe_especie (LOWER(espe_nome_popular))
    WHERE espe_ativo;

-- RF09: período de cultivo = uma ou mais estações. "Ano inteiro" = as 4 estações marcadas.
CREATE TABLE IF NOT EXISTS public.eses_especie_estacao (
    eses_espe_id INTEGER     NOT NULL REFERENCES public.espe_especie (espe_id) ON DELETE CASCADE,
    eses_estacao VARCHAR(10) NOT NULL,
    PRIMARY KEY (eses_espe_id, eses_estacao),
    CONSTRAINT eses_estacao_ck CHECK (eses_estacao IN ('primavera', 'verao', 'outono', 'inverno'))
);

-- RF11: procedimentos de cultivo (semeadura, plantio e cuidados), na ordem em que foram informados
CREATE TABLE IF NOT EXISTS public.proc_procedimento (
    proc_id        SERIAL      PRIMARY KEY,
    proc_espe_id   INTEGER     NOT NULL REFERENCES public.espe_especie (espe_id) ON DELETE CASCADE,
    proc_tipo      VARCHAR(20) NOT NULL,
    proc_descricao TEXT        NOT NULL,
    proc_ordem     SMALLINT    NOT NULL DEFAULT 0,
    CONSTRAINT proc_tipo_ck      CHECK (proc_tipo IN ('semeadura', 'plantio', 'rega', 'adubacao', 'poda', 'outro')),
    CONSTRAINT proc_descricao_ck CHECK (BTRIM(proc_descricao) <> '' AND CHAR_LENGTH(proc_descricao) <= 5000),
    CONSTRAINT proc_ordem_ck     CHECK (proc_ordem >= 0)
);

CREATE INDEX IF NOT EXISTS proc_espe_id_ix ON public.proc_procedimento (proc_espe_id, proc_ordem);
