# Fase 87 — Sincronización entre ciclos estructurales

## Objetivo
Evaluar si ciclos observados en tríadas distintas coinciden temporalmente o siguen periodos y secuencias estructurales comparables.

## Método
- Reutiliza los ciclos retrospectivos de la fase 86, calculados sobre ventanas cronológicas.
- Compara exclusivamente tríadas diferentes.
- Calcula solapamiento temporal como intersección de ventanas dividida entre unión de ventanas (Jaccard temporal).
- Comprueba igualdad de periodo y equivalencia de secuencia mediante rotaciones cíclicas.
- Puntaje descriptivo: 50% Jaccard temporal, 25% igualdad de periodo y 25% equivalencia de secuencia.
- Clasifica como alineada (>=0.75), parcial (>=0.45 y <0.75) o desfasada (<0.45).
- Presenta número de ciclos activos por ventana.

## Límites
El puntaje es una heurística descriptiva, no una prueba estadística de sincronía ni de dependencia. Los ciclos comparten ventanas históricas y pueden solaparse por construcción. No implica coordinación causal, periodicidad futura ni capacidad predictiva sobre TRIS. El resultado depende del tamaño de ventana, de la definición de ciclo y de los umbrales.
