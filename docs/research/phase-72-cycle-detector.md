# Fase 72 — Detector de ciclos y recurrencias

## Objetivo
Identificar recurrencias observadas en las secuencias históricas de hipótesis sin inferir capacidad predictiva.

## Métodos
- Clasificación: busca secuencias categóricas repetidas.
- Dirección: busca repetición en los signos de cambio de valores resueltos (sube, baja, sin-cambio).
- Períodos explorados: 2 a 8 observaciones.
- Requisitos: al menos dos repeticiones y cobertura de coincidencia mínima del 80%.
- Los estados constantes no se consideran ciclos.

## Integridad y límites
- Reutiliza la validación y el orden cronológico del historial de Fase 70.
- No rellena ausencias.
- Informa por separado los cambios de clasificación (cambios de régimen).
- Los patrones son descriptivos; no se calcula p-valor, significancia, ni capacidad predictiva.
- La cobertura no es probabilidad de que el patrón continúe.
