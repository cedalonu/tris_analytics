# TRIS Analytics — dashboard operativo inicial

## Cómo abrirlo
En la app existente, abre la URL con query parameter:
`?dashboard=operational`
El modo normal de la app permanece igual sin ese parámetro.

## Importar el CSV
1. Selecciona **Importar CSV actualizado**.
2. Carga el CSV histórico oficial de TRIS.
3. La interfaz valida campos CONCURSO, R1–R5 y FECHA.
4. Si hay errores de validación, no reemplaza el dataset anterior.
5. Si pasa validación, guarda la copia importada en localStorage de ese navegador.

## Módulos
- Panel principal: métricas de dataset, último resultado, frecuencia total, sorteos recientes.
- Historial: buscar concurso, resultado o fecha.
- Análisis por posición: frecuencia de 0–9 en R1 a R5.
- Integridad: advertencias, errores, saltos de concursos y reglas de importación.

## Reglas de integridad
- CONCURSO es la clave de orden e identificación.
- ID se ignora.
- R1–R5 se conservan exactamente en orden; 0 es un dígito válido.
- No se generan resultados faltantes ni predicciones.
- Las estadísticas son descriptivas y no evidencia de ventaja predictiva.
- Los datos se guardan en el navegador local; no se envían al servidor.

## Alcance
Esta entrega es la primera integración de UI y CSV histórico. El ledger prospectivo, auditoría de pronósticos y métricas reales del investigador todavía no están conectados al dashboard.
