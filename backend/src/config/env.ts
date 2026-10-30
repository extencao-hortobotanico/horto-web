import dotenv from 'dotenv';

// Carrega o .env (quando existir) antes de qualquer outro módulo ler process.env.
// Importe este arquivo primeiro nos pontos de entrada (index.ts, migrate.ts).
dotenv.config({ quiet: true });
