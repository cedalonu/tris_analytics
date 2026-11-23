# TrisAnalytics Pro

Caracterizador y laboratorio de estadísticas de los sorteos Tris (Vite + React + Tailwind v4).

## Uso local

```bash
npm install        # genera package-lock.json la primera vez; súbelo al repo
npm run dev        # http://localhost:3000 (servidor con Vite + HMR)
# o solo Vite:
npm run dev:vite   # http://localhost:5173
```

## Producción

```bash
npm run build      # vite build (dist/) + bundle del servidor (server.js)
npm start          # sirve dist/ en el puerto 3000 (o $PORT)
```

`vite.config.ts` usa `base: './'`, por lo que `dist/` también funciona publicado en un subpath (p. ej. GitHub Pages).

## Dependencias de la app
`react`, `react-dom`, `html2canvas`, `@google/genai`, `ml-random-forest`, `xlsx`.
