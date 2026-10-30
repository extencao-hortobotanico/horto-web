import './config/env';
import express from 'express';
import passport = require('./config/passport.config');
import authRouter from './routes/auth.router';
import usuarioRouter from './routes/usuario.router';

const app = express();
const PORT = process.env.PORT || 3002;

// Atrás do Nginx: usa X-Forwarded-For para obter o IP real nos logs
app.set('trust proxy', 'loopback, uniquelocal');

// Middlewares globais
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') { res.sendStatus(200); } else { next(); }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express 5 deixa req.body undefined quando a requisição não tem corpo
app.use((req, _res, next) => {
    req.body ??= {};
    next();
});

app.use(passport.initialize());

app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rotas da API
app.use('/api/auth',     authRouter);
app.use('/api/usuarios', usuarioRouter);

app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'API funcionando', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint não encontrado' });
});

app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Erros do cliente gerados pelo Express (ex.: JSON malformado) mantêm o status 4xx
    if (error.status && error.status >= 400 && error.status < 500) {
        res.status(error.status).json({ success: false, message: 'Requisição inválida' });
        return;
    }
    console.error('Erro interno:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`Servidor na porta ${PORT}`);
});

export default app;
