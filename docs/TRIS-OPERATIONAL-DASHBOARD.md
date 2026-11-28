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

## Importar ledger prospectivo
1. En GitHub, abre Actions → **TRIS live prospective cycle**.
2. En una ejecución exitosa de la rama `research-core-v1`, descarga el artefacto `tris-live-prospective-ledger`.
3. Descomprime el ZIP. En la carpeta `cycles` encontrarás `cycles.jsonl` y `outcomes.jsonl`.
4. En el dashboard, abre **Prospectiva / Ledger** e importa ambos archivos a la vez.
5. El panel muestra ciclos, pronósticos congelados, resueltos, pendientes estimados, comparación investigador/baseline y detalle por concurso.

La importación se conserva en el almacenamiento local del navegador. No envía archivos a un servidor ni cambia el ledger remoto. El artefacto contiene registros reales de la ejecución; el dashboard los visualiza, no los audita.

## Módulos
- Panel principal: métricas de dataset, último resultado, frecuencia total, sorteos recientes.
- Red de transiciones: conexiones entre dígitos de posiciones adyacentes (R1→R2→R3→R4→R5), con ventanas seleccionables de 50, 150 o 500 sorteos; filtro de todas, sobre esperado o 25% superior; tooltip y panel Top 8 de conteos.
- Estabilidad temporal: compara el top-10 de conexiones por conteo en ventanas de 50/150/500 sorteos; lista las conexiones que aparecen en top-10 de al menos dos ventanas y muestra conteos crudos. Repetición es descriptiva y no implica persistencia estadística ni predictiva.
- Referencia nula descriptiva: conteo esperado aproximado N/100 por pareja bajo independencia y uniformidad de dígitos. Ratio observado/esperado se muestra solo como descripción; no prueba señal, no corrige por múltiples comparaciones y no representa probabilidad del siguiente sorteo.
- Prospectiva / Ledger: ciclo por concurso, forecasts congelados, outcomes, hits y comparativa por familia.
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
Esta entrega conecta la interfaz con CSV histórico y permite importar el ledger prospectivo real de los artefactos de CI. La auditoría de integridad del ledger todavía debe verificarse por separado; importación visual no significa auditoría aprobada.


## Línea analítica independiente: aging y recurrencia de combinaciones (propuesta aprobada)

Esta línea es **descriptiva y separada del modelo predictivo**. El campo `ID` permanece excluido: no se lee, interpreta, utiliza para vincular registros ni se incluye en cálculos, ranking o generación de pronósticos.

### Métricas por combinación exacta de cinco dígitos
- **Frecuencia histórica:** número de apariciones de la combinación exacta en el histórico disponible.
- **Aging en sorteos:** cantidad de concursos transcurridos desde su aparición más reciente; se calcula con la secuencia de `CONCURSO`, no con `ID`.
- **Aging en días:** diferencia de fechas desde la última aparición, cuando las fechas son válidas; se muestra por separado del aging por concursos.
- **Última aparición:** concurso y fecha más recientes en que se observó.
- **Primera aparición observada:** primer concurso/fecha del dataset disponible, aclarando que no necesariamente es la primera aparición histórica absoluta.
- **Intervalos entre apariciones:** gaps de concursos; resumen mínimo, mediano, máximo y promedio cuando haya suficientes repeticiones.
- **Estado:** observada repetidamente, observada una vez o no encontrada en el histórico cargado. Las combinaciones no observadas no deben tener frecuencia o aging inventados.

### Reglas de integridad y presentación
- Usar la cadena de cinco dígitos R1–R5 en orden; preservar ceros a la izquierda.
- Definir aging en concursos como `último concurso cargado − concurso de última aparición` (consecutividad validada; si existen huecos, avisar).
- No inferir que una combinación “debe salir” por estar atrasada ni que su frecuencia la hace más probable.
- No usar estas métricas como input, filtro, peso o criterio del investigador automático ni de ninguna familia de pronósticos, salvo aprobación explícita posterior y evaluación prospectiva separada.
- Etiquetar las visualizaciones como retrospectivas/descriptivas; evitar lenguaje de “caliente”, “fría”, “debida” o “probabilidad aumentada”.

### Próxima implementación visual
Un panel independiente en el dashboard con búsqueda de combinación, tabla de frecuencia y aging, distribución de gaps, ranking por más repetidas y por mayor aging (solo descriptivo), y filtros por rango de concursos. Este panel no altera resultados, forecasts congelados ni ledger prospectivo.
