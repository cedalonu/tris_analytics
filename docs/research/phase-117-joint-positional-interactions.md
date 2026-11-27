# Fase 117 — Interacción conjunta de las cinco posiciones

## Objetivo
Medir coincidencias en un mismo concurso de cambios binarios en subconjuntos de 2, 3, 4 y 5 posiciones del TRIS.

## Método
- Para cada concurso objetivo, se compara cada dígito con el concurso inmediatamente anterior; cambio = 1, sin cambio = 0.
- Se enumeran los 26 subconjuntos posibles de tamaños 2 a 5.
- Se calcula la frecuencia observada de que todas las posiciones del subconjunto cambien en el mismo concurso.
- Referencia de independencia: producto de las tasas marginales de cambio de las posiciones del subconjunto.
- Control nulo: en cada réplica, cada una de las cinco series se desplaza circularmente de forma independiente. Así se conserva aproximadamente su tasa y autocorrelación circular, rompiendo la alineación conjunta.
- Se estima la media e intervalo percentil 95% del control; prueba unilateral de exceso de coincidencia y ajuste Benjamini-Hochberg sobre los 26 patrones.
- Se informa persistencia descriptiva por bloques temporales.

## Ejecución
```bash
npm run research:joint-positional-interactions -- Tris.csv 5000 6000 999 1172026 10
```
Genera `reports/joint-positional-interactions/latest.json` y `latest.md`.

## Interpretación y límites
El valor esperado independiente es una referencia algebraica, no el control inferencial. El control circular es aproximado y tiene efectos de borde. El análisis es de cambios/no cambios, no del dígito concreto. No exige que las posiciones fuera del subconjunto permanezcan quietas. Los bloques no son validación prospectiva. Una asociación conjunta no demuestra causalidad, capacidad predictiva ni rentabilidad.
