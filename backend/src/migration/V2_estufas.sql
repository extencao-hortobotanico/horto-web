-- V2: estufas (RF01, RF02, RF06, RF07)

-- Ordenação natural para listagens por nome: "Estufa 2" antes de "Estufa 10", sem diferenciar
-- maiúsculas/acentos no desempate. Uso: ORDER BY <coluna> COLLATE ordem_natural
CREATE COLLATION IF NOT EXISTS public.ordem_natural (provider = icu, locale = 'pt-BR-u-kn');

CREATE TABLE IF NOT EXISTS public.estu_estufa (
    estu_id            SERIAL        PRIMARY KEY,
    estu_identificacao VARCHAR(100)  NOT NULL,                       -- ex.: "Estufa 1"
    estu_comprimento   NUMERIC(10,2) NOT NULL,                       -- metros
    estu_largura       NUMERIC(10,2) NOT NULL,                       -- metros
    estu_area          NUMERIC(12,2) GENERATED ALWAYS AS (estu_comprimento * estu_largura) STORED, -- m², calculada (RF01)
    estu_ativo         BOOLEAN       NOT NULL DEFAULT TRUE,          -- false = excluída, mas mantida por ter histórico (RF07)
    estu_criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    estu_atualizado_em TIMESTAMPTZ,
    -- RF02: sem limite de plantas; apenas as medidas são obrigatórias e positivas
    CONSTRAINT estu_comprimento_ck   CHECK (estu_comprimento > 0),
    CONSTRAINT estu_largura_ck       CHECK (estu_largura > 0),
    -- Medidas positivas ainda podem gerar área 0,00 após o arredondamento (ex.: 0,05 × 0,05)
    CONSTRAINT estu_area_ck          CHECK (estu_area > 0),
    CONSTRAINT estu_identificacao_ck CHECK (BTRIM(estu_identificacao) <> '')
);

-- Identificação única (sem diferenciar maiúsculas) entre as estufas ativas.
-- Uma estufa excluída que ficou apenas desativada não impede reutilizar a identificação.
CREATE UNIQUE INDEX IF NOT EXISTS estu_identificacao_uk
    ON public.estu_estufa (LOWER(estu_identificacao))
    WHERE estu_ativo;
