# Panel visual de investigación prospectiva

El predictor incorpora el acceso **🔬 Investigación**. Abre un panel independiente; el predictor principal sigue disponible al volver.

## Carga del historial CSV en el predictor

Al abrir la aplicación, no se consulta GitHub ni se descarga el CSV automáticamente. Usa **Importar Tris.csv** y selecciona el archivo local. El importador valida el encabezado esperado, los cinco dígitos por concurso, las fechas y los concursos duplicados antes de actualizar el historial. Una copia queda en el almacenamiento local del navegador para la siguiente sesión; no se transmite a ningún servidor. Para actualizar el historial, vuelve a importar manualmente el CSV actualizado.

## Uso

1. Ejecuta los análisis desde la raíz del repositorio con Node.js y las dependencias instaladas.
2. En el panel, selecciona **Importar JSON** y elige uno o varios archivos `latest.json` generados por los runners.
3. El panel identifica cada informe por su campo `method`, no por el nombre del archivo.
4. Cambia de pestaña para consultar integridad, cobertura, desempeño, estabilidad o sensibilidad.
5. Los informes se leen en memoria del navegador. No se suben a un servidor y no se escriben ni modifican los archivos originales.

## Informes compatibles

| Fase | Comando local | Archivo JSON |
|---|---|---|
| 41 · Integridad | `npm run research:prospective-audit -- ./data/prospective` | `reports/prospective-ledger-audit/latest.json` |
| 42 · Cobertura | `npm run research:prospective-coverage -- ./data/Tris.csv ./data/prospective` | `reports/prospective-coverage/latest.json` |
| 43 · Desempeño | `npm run research:prospective-performance -- ./data/prospective` | `reports/prospective-performance/latest.json` |
| 44 · Estabilidad temporal | `npm run research:prospective-performance-stability -- ./data/prospective` | `reports/prospective-performance-stability/latest.json` |
| 45 · Sensibilidad temporal | `npm run research:prospective-performance-sensitivity -- ./data/prospective` | `reports/prospective-performance-sensitivity/latest.json` |

La fase 42 requiere el CSV local validado y el directorio del ledger. Las demás fases leen el ledger local. Ajusta las rutas si tus archivos están en otra ubicación.

## Alcance y límites

- El panel solo visualiza informes existentes; no fabrica métricas ni rellena campos ausentes.
- La comparación de desempeño muestra tasa de candidato y baseline junto con N y diferencia pareada cuando el informe las contiene.
- Cobertura no equivale a precisión; integridad limpia no equivale a predictibilidad.
- Los informes deben provenir del mismo conjunto de datos y periodo de análisis si se van a comparar entre sí.
- La selección de archivos se realiza manualmente. No hay APIs, descargas automáticas, polling ni transmisión de archivos.
- El panel no guarda los informes entre sesiones; vuelve a importarlos cuando abras la interfaz de nuevo.
