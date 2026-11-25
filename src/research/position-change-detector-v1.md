# TRIS — detector de cambios por posición v1

## Alcance
Analiza exclusivamente outcomes prospectivos resueltos. No reconstruye resultados históricos, no genera pronósticos y no modifica selección ni pesos.

## Unidad de análisis
Cada serie se aísla por posición R1–R5, familia, configuración exacta congelada, régimen de pool previo y régimen de duplicados previo. Las señales transition de resultado completo se excluyen.

## Método
1. Promediar aciertos candidatos y baseline dentro de cada concurso.
2. Formar bloques cronológicos no solapados de 25 concursos; bloque final solo con al menos 10.
3. Calcular ventaja = cobertura candidata menos cobertura baseline.
4. Usar todos los bloques anteriores a los dos más recientes como referencia.
5. Comparar los dos bloques recientes con esa referencia; zona neutral ±2 puntos porcentuales.

## Estados
- insufficient-data: menos de dos bloques de referencia y dos recientes.
- stable: los dos bloques recientes permanecen en zona neutral.
- improvement / deterioration: solo el último bloque rebasa la zona neutral.
- persistent-change: los dos bloques recientes rebasan la zona neutral en la misma dirección.
- recovery: dos bloques recientes favorables tras dos bloques de referencia desfavorables.

Son alertas descriptivas, no pruebas de significación ni evidencia de rentabilidad. La tasa de falsas alarmas aún no está estimada.

## Ejecución offline
npm run research:position-change -- data/cycles

Lee outcomes.jsonl y genera position-change.json y position-change.md. Sin APIs, red, polling ni mutación del journal.

## Límites
No se transfiere evidencia entre posiciones, familias, configuraciones o contextos. No modifica pronósticos congelados, pesos, selección, ciclo de vida ni registro de hipótesis. Requiere evaluación walk-forward y prospectiva antes de cualquier uso adaptativo.
