# Fase 84 — Transiciones entre patrones estructurales

## Objetivo
Describir cómo evolucionan las tríadas exactas entre ventanas cronológicas consecutivas, separando persistencia, aparición, desaparición y reconfiguración.

## Método
- Reutiliza las ventanas y los motivos de la fase 83; cada ventana reconstruye la red histórica con las relaciones respaldadas.
- Identifica cada tríada mediante la clave ordenada de sus tres miembros.
- Compara la presencia y el tipo topológico de cada clave entre dos ventanas consecutivas.
- Clasifica cada evento como:
  - **Estable:** la tríada existe en ambas ventanas y conserva su tipo.
  - **Aparición:** la clave no existe en la ventana anterior y sí en la actual.
  - **Desaparición:** la clave existe en la ventana anterior y no en la actual.
  - **Reconfiguración:** la misma tríada aparece en ambas ventanas, pero cambia entre sin conexiones, una conexión, cadena abierta o triángulo.
- Resume las transiciones de forma (tipo anterior → tipo posterior), persistencia y reconfiguración. Las tasas de persistencia/reconfiguración usan solo tríadas presentes en ambas ventanas.

## Límites e interpretación
Las apariciones y desapariciones pueden deberse a cambios en el conjunto de nodos disponibles, no solo a cambios de conectividad. La comparación es estricta por identidad de los tres miembros y no empareja tríadas distintas aunque tengan formas iguales. Los resultados son descriptivos, dependen del tamaño de ventana y de las reglas de la fase 83, y no demuestran causalidad ni capacidad predictiva.

## Pruebas
Se agregan pruebas unitarias para estabilidad, aparición, desaparición, reconfiguración en ambas direcciones y ventanas sin eventos. Deben ejecutarse con `npm run test:research` en un entorno con dependencias instaladas.
