import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }

    // Em dev, /api é repassado para o backend. No Docker o alvo é http://backend:3002.
    const apiTarget = env.VITE_PROXY_TARGET || 'http://localhost:3002'

    return {
        plugins: [react()],
        server: {
            port: 3001,
            host: true,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
    }
})
