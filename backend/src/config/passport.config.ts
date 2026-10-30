import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { UsuarioService } from '../service/usuario.service';
import { JwtPayload } from '../service/auth.service';

const usuarioService = new UsuarioService();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET precisa ser definido nas variáveis de ambiente');
}

const jwtOptions: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
    algorithms: ['HS256']
};

passport.use(
    new JwtStrategy(jwtOptions, async (jwtPayload: JwtPayload, done) => {
        try {
            // Consulta o banco a cada requisição para que a desativação tenha efeito imediato
            const usuario = await usuarioService.buscarPorId(jwtPayload.id);

            if (usuario && usuario.ativo) {
                return done(null, usuario);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

export = passport;
