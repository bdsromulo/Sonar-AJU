import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serve o site em https://bdsromulo.github.io/Sonar-AJU/,
// então os assets precisam do prefixo do repositório.
// https://vite.dev/config/
export default defineConfig({
  base: '/Sonar-AJU/',
  plugins: [
    react(),
    tailwindcss()
  ],
});
