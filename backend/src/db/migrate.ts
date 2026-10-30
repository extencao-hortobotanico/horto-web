import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import db from './database';

// Em dev resolve para src/migration; no build, o Dockerfile copia os .sql para dist/migration
const MIGRATIONS_DIR = path.join(__dirname, '../migration');

async function migrate(): Promise<void> {
    await db.none(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version     VARCHAR(50) PRIMARY KEY,
            filename    VARCHAR(200) NOT NULL,
            applied_at  TIMESTAMP DEFAULT NOW()
        )
    `);

    const applied: string[] = await db.map(
        'SELECT version FROM schema_migrations ORDER BY version',
        [],
        (row) => row.version as string
    );

    // Arquivos no formato V<numero>_<descricao>.sql, aplicados em ordem numérica
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => /^V\d+_.*\.sql$/.test(f))
        .sort((a, b) => {
            const vA = parseInt(a.match(/^V(\d+)/)?.[1] ?? '0', 10);
            const vB = parseInt(b.match(/^V(\d+)/)?.[1] ?? '0', 10);
            return vA - vB;
        });

    let ran = 0;
    for (const file of files) {
        const version = file.match(/^(V\d+)/)?.[1] ?? file;

        if (applied.includes(version)) {
            console.log(`  skip  ${file}`);
            continue;
        }

        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

        process.stdout.write(`  run   ${file} ... `);
        try {
            await db.tx(async t => {
                await t.none(sql);
                await t.none(
                    'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)',
                    [version, file]
                );
            });
            console.log('OK');
            ran++;
        } catch (err) {
            console.log('ERRO');
            throw err;
        }
    }

    if (ran === 0) {
        console.log('  Banco já atualizado, nenhuma migration pendente.');
    } else {
        console.log(`\n  ${ran} migration(s) aplicada(s) com sucesso.`);
    }
}

migrate()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\nErro ao executar migrations:', err instanceof Error ? err.message : err);
        process.exit(1);
    });
