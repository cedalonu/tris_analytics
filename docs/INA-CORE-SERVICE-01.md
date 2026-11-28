# INA Core — primer servicio de conocimiento descriptivo

**Etapa:** P1.2 del plan maestro TRIS  
**Rama:** `research-core-v1`  
**Estado:** servicio puro implementado; validación CI pendiente.

## 1. Alcance

`src/research/ina-core.ts` consume un `InaContextInput` y genera la primera capa común de conocimiento descriptivo. No realiza predicciones ni sustituye los laboratorios especializados.

## 2. Conocimiento publicado

- Rango de concursos y fechas.
- Cantidad de sorteos y corte.
- Brechas entre números de concurso consecutivos presentes (sin rellenar faltantes).
- Para cada posición R1–R5 y dígito 0–9: ocurrencias, tasa empírica, último concurso observado, ausencia actual e intervalo medio entre apariciones.

La ausencia se expresa en sorteos observados posteriores al último registro del dígito. El intervalo medio se calcula sobre las distancias entre índices de apariciones, convertido a sorteos intermedios. No se confunde con probabilidad ni con una recomendación de apuesta.

## 3. Control de integridad

Si la versión del snapshot no coincide con conteo/rango o tiene errores de validación, INA responde `quarantined`, devuelve los bloqueos y no publica salidas analíticas. Un snapshot válido produce una salida `ResearchOutput` etiquetada como `descriptive`, heredando versión, hash, corte y tamaño de muestra del contexto.

## 4. Pruebas añadidas

`src/research/ina-core-service.test.ts` comprueba:
- Cinco perfiles posicionales con conteos conocidos.
- Cálculo de tasa, última aparición, ausencia e intervalo medio.
- Conservación explícita de huecos de concursos.
- Cuarentena ante metadatos inconsistentes.
- Dataset vacío sin inventar frecuencias.

## 5. Límites y siguiente paso

Este servicio es la primera fuente compartida de métricas descriptivas. Aún no incorpora memoria persistente, un registro de módulos, caché/versiones de salidas, invalidación de dependencias ni lectura del CSV desde el workflow. Esos aspectos siguen en P1.3/P2/P4.
