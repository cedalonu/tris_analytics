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

## Investigación TRIS

La guía de operación, ciclos de aprendizaje, validación histórica y resguardo de memoria está en [docs/TRIS-OPERATIONS.md](docs/TRIS-OPERATIONS.md).


## Plan maestro vigente

El desarrollo integral, las etapas de INA, los criterios de cierre y la secuencia obligatoria de trabajo están definidos en [TRIS-MASTER-EXECUTION-PLAN-v2.md](docs/TRIS-MASTER-EXECUTION-PLAN-v2.md). Este documento coordina el roadmap de investigación anterior y los checkpoints de integración y visualización.
