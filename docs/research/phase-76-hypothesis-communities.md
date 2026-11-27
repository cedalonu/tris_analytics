# Fase 76 — Análisis de comunidades y clústeres

## Objetivo
Detectar grupos de hipótesis conectadas en la red de Fase 75 y medir cohesión, separación y sensibilidad a los criterios de inclusión.

## Método
- Propagación determinista de etiquetas sobre las aristas: cada nodo adopta la etiqueta con mayor peso de conexión; desempate lexicográfico.
- Partición estricta: solo aristas respaldadas.
- Partición relajada: respaldadas y sugestivas.
- Cohesión: proporción de aristas internas respecto de todas las aristas posibles dentro del grupo.
- Conductancia descriptiva: peso de aristas que cruzan el límite del grupo dividido por el volumen ponderado de sus nodos.
- Estabilidad: proporción de pares cuya decisión de pertenecer al mismo grupo coincide entre partición estricta y relajada.

## Limitaciones
La propagación de etiquetas es heurística y depende del orden y la topología. La comparación estricta/relajada mide sensibilidad al criterio, no estabilidad temporal. Las comunidades no son causas ni señales predictivas. Se heredan los supuestos y limitaciones de la Fase 74.
