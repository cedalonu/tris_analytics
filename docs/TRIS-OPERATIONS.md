# TRIS — guía operativa del investigador

## Propósito y límites

El laboratorio usa como única fuente autorizada el archivo [Tris.csv de pakinja/pakin](https://github.com/pakinja/pakin/blob/master/Tris.csv). El comando `research:cycles:source` consulta ese archivo una sola vez cuando el operador lo ejecuta; no hay polling, tareas programadas ni llamadas a APIs. Cada descarga validada se conserva como snapshot inmutable con SHA-256 y metadatos de procedencia.

El sistema produce hipótesis y pools experimentales congelados. No conoce el resultado futuro, no garantiza aciertos, no calcula rentabilidad ni convierte tasas de cobertura en probabilidades calibradas. Los informes retrospectivos no son evidencia prospectiva.

Trabajar únicamente en la rama `research-core-v1`; no integrar cambios directamente en `main`.

## Puesta en marcha local

Requiere Node.js 20 o superior y npm.

```bash
git clone https://github.com/cedalonu/tris_analytics.git
cd tris_analytics
git switch research-core-v1
npm install
npm run lint
npm run test:research
npm run build
npm run dev
```

Abrir `http://localhost:3000`. Para una compilación de producción: `npm run build` y después `npm start`.

## Flujo de trabajo recomendado

### 1. Obtener y validar el CSV

La forma recomendada es ejecutar el ciclo directamente contra la fuente autorizada:

```bash
npm run research:cycles:source
```

El comando descarga una sola vez el CSV público, valida su estructura, continuidad de IDs y mínimo de 200 sorteos, calcula SHA-256, conserva el archivo original en `data/source-snapshots/` y registra un manifiesto `.json` con URL, hora de consulta, tamaño, rango de concursos y hash. Después ejecuta el ciclo y su auditoría sobre exactamente ese mismo snapshot. Si la fuente no responde o los datos no pasan la validación, el proceso se detiene sin alterar el ledger. No modifica ni reordena el CSV original.

También se admite el flujo manual: descargar el archivo autorizado y guardarlo como `data/Tris.csv`.

### 2. Congelar y actualizar el ciclo de aprendizaje

Después de cada sorteo publicado, abrir **Actions → TRIS live prospective cycle → Run workflow** en la rama `research-core-v1`. Este flujo manual consulta la fuente una vez, restaura el último ledger exitoso, ejecuta ciclo + auditoría y publica un artefacto versionado para la siguiente ejecución. No existe un calendario ni polling automático. También puede ejecutarse localmente con `npm run research:cycles:source`. Si se trabaja con un archivo manual, usar:

```bash
npm run research:cycles -- data/Tris.csv data/cycles
npm run research:cycles-audit -- data/Tris.csv data/cycles
```

El ciclo:
- resuelve únicamente pronósticos previamente congelados cuyo ID de sorteo aparece exactamente en el CSV;
- compara cada señal con su baseline pareado;
- crea el siguiente ciclo para el sorteo inmediato posterior al último registro;
- conserva configuración, huella SHA-256 del histórico y hora de congelación;
- mantiene memoria de ciclo, estados de señales y contexto posicional;
- proyecta los resultados en `signals.json`, el ledger del evaluador compartido con el panel;
- selecciona el siguiente portafolio con el investigador adaptativo: mitad aproximada de cada cuota familiar para explorar candidatos menos observados y el resto para explotar ventajas pareadas históricas contra baseline, con contracción por muestra;
- exporta `investigator-report.json` con candidatos, configuraciones, motivos, conteos y advertencias del concurso objetivo;
- puede proponer hasta 20 variantes nuevas de una sola dimensión (ventana de pool o umbral de ausencia) a partir de padres con al menos 25 resultados prospectivos resueltos y ventaja pareada positiva contra baseline tras contracción; las variantes empiezan como hipótesis independientes y no heredan evidencia del padre;
- no rellena sorteos perdidos ni reconstruye pronósticos retrospectivos.

Guardar y respaldar íntegramente `data/cycles/` entre ejecuciones. Incluye `cycles.jsonl`, `outcomes.jsonl`, `state.json`, `signals.json`, `investigator-report.json`, `lifecycle.json`, `position-context-memory.json` y `latest-report.md`. El archivo `signals.json` es una proyección evaluada de `outcomes.jsonl`, no una segunda fuente de resultados: se reconstruye de forma determinista si una ejecución se interrumpe después de escribir resultados. Los archivos JSONL son registros append-only; no editarlos a mano.

La auditoría comprueba el checkpoint del prefijo histórico, la identidad de ciclos y pronósticos, el vínculo entre resultados y pronósticos congelados y la resolución exacta contra el CSV. Si falla por truncamiento, alteración del histórico o falta de checkpoint, detenerse y recuperar el ledger y CSV originales; no borrar el estado para forzar una inicialización.

**Frecuencia:** ejecutar después de cada sorteo para no perder cobertura prospectiva. Si se omite un sorteo, el proceso no inventa el pronóstico perdido; informa el hueco de cobertura.

### 3. Validación histórica congelada (investigación, no prospectiva)

Para ejecutar el catálogo de hipótesis con particiones cronológicas:

```bash
npm run research:validate -- data/Tris.csv data/historical-validation
```

Este proceso exige al menos 600 sorteos contiguos: 200 de calentamiento y particiones de discovery, validation y holdout. Congela manifiesto, catálogo, presupuesto y límites temporales. Al repetirlo, reutiliza el manifiesto; no cambia las particiones para favorecer resultados. El holdout sigue siendo histórico, no futuro.

### 4. Otros evaluadores prospectivos

Existe un runner alternativo:

```bash
npm run research:prospective -- data/Tris.csv data/prospective
npm run research:prospective-audit -- data/Tris.csv data/prospective
```

Este usa un esquema separado (`forecasts.jsonl`, `results.jsonl`, `signals.json`, `evaluations.json`). No mezclar manualmente sus registros con `data/cycles/`: son ledgers y protocolos distintos. Para el uso operativo ordinario, preferir `research:cycles` como flujo de ciclo y memoria contextual; ejecutar el runner alternativo solo si se desea mantener su experimento separado. No sumar sus conteos como si fueran una única muestra independiente.

## Memoria y estados

- `hypothesis`: propuesta sin evidencia validada.
- `testing`: tiene observaciones de validación, aún sin superar los filtros.
- `provisional`: superó filtros históricos conservadores; requiere replicación prospectiva.
- `active`: solo cuando también supera los filtros prospectivos establecidos.
- `weakening` / `retired`: evidencia prospectiva que no sostiene la señal o deterioro en el protocolo correspondiente.

Los estados del ciclo (`emerging`, `persistent`, `weakening`, `retired`, etc.) describen bloques de observaciones congeladas y no deben confundirse con probabilidades o certificaciones estadísticas. Las señales retiradas no se seleccionan para nuevos ciclos; su historial permanece conservado.

## Panel

El panel de intuición permite importar manualmente un ResearchPlan JSON, un ledger de señales JSON, el informe adaptativo (`investigator-report.json`) y la memoria contextual (`position-context-memory.json`). El informe adaptativo permite auditar qué hipótesis se eligieron para el próximo concurso, separando exploración y explotación. Para revisar el estado del ciclo operativo, importar `data/cycles/signals.json`. La importación es explícita: el navegador no lee automáticamente archivos locales de `data/cycles/` ni ejecuta los runners. Exportar/seleccionar los archivos generados por los scripts para inspeccionarlos en la interfaz. El panel es una vista de análisis; la ejecución y la persistencia append-only pertenecen a los scripts locales.

## Reproducibilidad y seguridad del dato

- Registrar la fecha de descarga y conservar el CSV original.
- No rellenar sorteos ausentes, duplicados ni resultados dudosos.
- Conservar los reportes y hashes junto con cada versión del ledger.
- No cambiar una configuración congelada después de conocer el resultado.
- No borrar el checkpoint para sortear un error de integridad.
- Separar estrictamente discovery, validation, holdout y prospective.
- No declarar una señal predictiva por una diferencia histórica aislada.
- Un nuevo resultado prospectivo entra cuando el CSV publicado contiene el concurso y el operador vuelve a ejecutar el comando de fuente.

## Comandos útiles

| Tarea | Comando |
|---|---|
| Verificar tipos | `npm run lint` |
| Pruebas unitarias | `npm run test:research` |
| Compilar | `npm run build` |
| Ciclo desde la fuente autorizada | `npm run research:cycles:source` |
| Ciclo de memoria manual | `npm run research:cycles -- data/Tris.csv data/cycles` |
| Auditar ciclo | `npm run research:cycles-audit -- data/Tris.csv data/cycles` |
| Validación histórica | `npm run research:validate -- data/Tris.csv data/historical-validation` |
| Panel local | `npm run dev` |
