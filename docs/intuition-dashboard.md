# Panel Intuición artificial

El componente `src/IntuitionDashboard.tsx` se abre desde el botón **Intuición artificial** del panel TRIS. Recibe el historial ya cargado en memoria por la aplicación y no realiza llamadas de red ni descargas.

## Vistas

- **Resumen:** estado del historial, último concurso, ventanas disponibles y actividad reciente.
- **Memoria de señales:** explica los estados del ledger. El panel no finge que existe un ledger cargado: la conexión de lectura/escritura del registro persistente queda pendiente.
- **Hipótesis:** muestra el tamaño del catálogo definido por el generador y deja explícito que no equivale a hipótesis evaluadas. La importación del plan congelado y de sus resultados queda pendiente.
- **Concordancia:** calcula conteos marginales de dígitos por posición sobre las últimas 20 y 50 filas del historial cargado. Presenta top 3 por posición, coincidencias entre rankings y comparación de top 1 entre ventanas.

## Límites metodológicos

Las frecuencias y coincidencias son descriptivas. No son probabilidades futuras, no prueban dependencia, no generan por sí solas una ventaja y no deben presentarse como pronósticos. La memoria persistente debe conectarse al ledger de investigación con operaciones append-only y auditoría; nunca debe inferirse o completar evidencia faltante desde la interfaz.

## Uso

1. Importar manualmente `Tris.csv` desde el panel principal.
2. Abrir **Intuición artificial**.
3. Consultar las vistas; los conteos se recalculan desde el historial en memoria.
4. Para la memoria de señales y el catálogo evaluado, conectar en una fase posterior los artefactos congelados del motor de investigación. Hasta entonces, sus estados permanecen explícitamente pendientes.

El módulo es local y exploratorio. No modifica el ledger, no ejecuta sorteos ni afirma capacidad predictiva.
