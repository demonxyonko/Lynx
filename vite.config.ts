import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://demonxyonko.github.io/Lynx/
export default defineConfig({ base: '/Lynx/', plugins: [react()], build: { target: 'es2020' } });
