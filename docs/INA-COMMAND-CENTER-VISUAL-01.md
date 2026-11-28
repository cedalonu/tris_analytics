# Entrega visual INA — Centro de comando 01

**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Estado:** primera pantalla integrada en el dashboard; P3 global permanece abierto.

## Entrega

Se incorpora una vista dedicada **Centro INA** al dashboard operativo:

- Componente: `src/InaCommandCenter.tsx`.
- Integración/navegación: `src/TrisOpsDashboard.tsx`.
- Sistema visual: `src/tris-intel.css`.
- Motor de datos: `src/research/ina-positional-transitions.ts`.

La vista no contiene datos de demostración. Recibe el `ResearchOutput<InaTransitionKnowledge>` generado desde el contexto INA activo. Cambiar la ventana (50, 150 o 500 sorteos) solicita una nueva salida del mismo motor; seleccionar un nodo filtra visualmente sus aristas relacionadas.

## Elementos visuales

1. Cabecera de INA y estado de conexión al snapshot.
2. Indicadores de tamaño del histórico, ventana analítica, conexiones observadas y corte INA.
3. Grafo SVG de cinco columnas posicionales (R1–R5), diez nodos por columna y aristas de transiciones adyacentes.
4. Selección accesible por clic o teclado de nodos Rn-dígito.
5. Panel contextual del nodo y lista de conexiones de mayor conteo.
6. Procedencia: fuente, hora de captura, rango, versión del dataset, SHA-256 y versión del motor.
7. Aviso de evidencia descriptiva: conteos observados y referencia uniforme aproximada no son probabilidades ni predicciones.

## Integración y límites

- El grafo usa la salida versionada de INA; no vuelve a calcular la matriz de transiciones en el componente.
- El control de ventana comparte el estado del dashboard.
- La vista es una primera entrega visual funcional, no el dashboard integral final.
- El mapa INA anterior se conserva como vista secundaria para comparación.
- No se afirma que el despliegue público esté disponible; esta entrega está en la rama de trabajo.
- P2.8 y P3 siguen abiertos. En particular, la estabilidad, entropía y otros estudios aún requieren migración completa a salidas INA y vistas propias.

## Verificación

La ejecución de GitHub Actions para el commit visual inició:

- TRIS research validation: TypeScript check y build visual reportados como exitosos; suite de pruebas aún en ejecución al registrar este documento.
- TRIS real-history integration validation: en ejecución.
- TRIS live prospective cycle: en ejecución / resultado pendiente de cierre definitivo.

Por tanto, esta nota no declara CI integral aprobada. Se actualizará el estado cuando las ejecuciones terminen.

## Puesta en marcha local

```bash
git checkout research-core-v1
git pull --ff-only origin research-core-v1
npm install
npm run dev
```

Abrir `http://localhost:3000/?dashboard=operational` y elegir **Centro INA** en la navegación lateral.


## Segunda iteración visual — aproximación fiel a `pics/ina.jpg`

La imagen del repositorio `pics/ina.jpg` es la referencia de diseño que debe replicarse en la aplicación, no una imagen decorativa que se inserta en el dashboard. La segunda iteración refuerza su composición:

- núcleo de red neuronal central con iluminación verde/cian y fondo técnico oscuro;
- paneles laterales de señales;
- pequeñas series temporales reales para las cinco conexiones más frecuentes, divididas cronológicamente dentro de la ventana seleccionada;
- jerarquía de paneles e instrumentación de aspecto analítico;
- procedencia y límites interpretativos siempre visibles.

Para evitar series ficticias, `edgeTimeline` ahora se calcula en `buildInaPositionalTransitions` a partir de los sorteos reales del snapshot y se incluye en el output versionado. La interfaz solo representa esa serie; no fabrica puntos ni vuelve a calcular la estadística.

Pruebas ampliadas para verificar que la suma de cada serie temporal coincide con el conteo total observado de su conexión y que el histórico vacío no crea señales.

**Estado de validación de esta iteración:** TypeScript y build visual aparecen exitosos en una ejecución de CI del componente; las ejecuciones que incluyen la serie temporal ampliada están todavía en curso. No se declara CI completa hasta su cierre.


## Tercera iteración visual — estabilidad y entropía INA

Se integra en el Centro INA un panel de estabilidad temporal y dispersión por posición. La vista recibe `ResearchOutput<InaTransitionStabilityKnowledge>` generado desde el mismo `InaContext` que alimenta la red de transiciones.

Elementos mostrados:
- tamaño y rango real de las ventanas reciente y anterior, no superpuestas;
- entropía normalizada por posición para ambas ventanas y su diferencia;
- conexiones con mayores cambios de tasa entre ventanas, con conteos anterior/reciente y diferencia en puntos porcentuales;
- corte y versión del dataset compartidos con el resto de INA.

El componente no calcula entropía ni compara ventanas: representa la salida del motor `buildInaTransitionStability`. Se mantiene el lenguaje descriptivo y se advierte que ni la entropía ni el cambio de tasa son señales predictivas validadas.

**Estado:** avance P2.8/P3; no se declara cerrada la migración mientras siga existiendo el comparador duplicado en la vista general ni se hayan completado las pruebas de equivalencia y CI integral.
