# Fase 81 — Exposición estructural entre comunidades

## Objetivo
Estimar el alcance topológico que tendría una hipótesis semilla dentro de la red histórica de asociaciones, sin afirmar que exista propagación real o causal.

## Método
- La red principal utiliza exclusivamente aristas clasificadas como `supported`.
- Se ejecuta una búsqueda en anchura con horizonte configurable de 1 a 4 saltos.
- La exposición de una hipótesis alcanzada es el máximo producto de intensidades absolutas de correlación entre los caminos de longitud mínima.
- Se filtran nodos por exposición mínima y se resumen alcance, fracción de red, grupos topológicos y distribución por salto.
- Se repite el cálculo con aristas sugerentes para un análisis de sensibilidad, separado del ranking principal.

## Interpretación y límites
La intensidad no es probabilidad. Los grupos son etiquetas topológicas derivadas de la red usada en la simulación, no comunidades sociales o causales verificadas. El modelo no modifica datos históricos ni demuestra transmisión, influencia o capacidad predictiva. Los resultados dependen de umbral, horizonte, muestra y reglas de asociación.

## Verificación
Se agregan pruebas unitarias para rutas, atenuación, umbral, nodos desconectados, sensibilidad y red de un solo nodo. La ejecución de CI depende de que el repositorio tenga un flujo activo.
