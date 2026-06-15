# Documento de Implementacion

## Proyecto
AppTarot

## Fecha
14 de junio de 2026

## Contexto del problema
En el flujo de tirada, al hacer clic en una carta revelada se navegaba a la ficha de detalle de la carta. Esta navegacion sacaba al usuario de la lectura actual, provocando perdida de contexto.

Impacto para el usuario:
- Se perdia la continuidad de la tirada.
- No existia retorno directo a la lectura activa.
- No se preservaba claramente el estado de cartas y orden al consultar significados.

## Objetivo funcional
Mantener la integridad de la tirada durante la consulta de significados, cumpliendo:
1. Ver significado sin salir de la pagina de tirada.
2. Si se navega a detalle, disponer de retorno claro a la tirada activa.
3. Persistir la tirada hasta que el usuario limpie o genere una nueva.

## Solucion implementada

### 1) Consulta de significado in-page
Se implemento un modal de significado en la pagina de tirada para evitar salida de contexto.

Comportamiento:
- El clic sobre una carta revelada abre modal con:
  - Nombre de la carta
  - Imagen
  - Significado directo
  - Significado invertido
  - Simbolos clave
- El modal se puede cerrar con boton, clic en fondo o tecla Escape.

Resultado:
- El usuario consulta significado sin abandonar la lectura.

### 2) Navegacion opcional a ficha completa con retorno
Se mantuvo la posibilidad de abrir la ficha completa de la carta desde el modal.

Comportamiento:
- El enlace a ficha completa agrega returnTo=/cards/random-cards.
- En la pagina de detalle, si existe returnTo valido, se muestra boton:
  - Volver a mi tirada actual
- Se aplica validacion para aceptar solo rutas internas esperadas del flujo de tirada.

Resultado:
- Si el usuario decide salir a detalle, puede regresar de forma clara y directa.

### 3) Persistencia de tirada
Se implemento persistencia en localStorage con clave:
apptarot_random_reading_v1

Estado persistido:
- Modalidad de tirada
- Numero de cartas
- Orden de cartas seleccionadas
- Cartas reveladas
- Cartas de aclaracion
- Interpretacion de la tirada (HTML)

Reglas:
- Se restaura automaticamente al volver a la pagina de tirada.
- Limpiar elimina el estado guardado.
- Barajar genera una nueva tirada y sobreescribe estado anterior.

Resultado:
- La lectura se conserva entre navegaciones/recargas hasta accion explicita del usuario.

## Archivos modificados

1. src/pages/cards/random-cards.astro
Cambios principales:
- Se amplio el modelo de carta para incluir significado, simbolos y keywords.
- Se reemplazo la navegacion directa en carta revelada por apertura de modal.
- Se incorporo el modal de significado con eventos de cierre.
- Se agrego persistencia local y restauracion de estado.
- Se actualizo el enlace a ficha completa para enviar returnTo.

2. src/pages/cards/[id].astro
Cambios principales:
- Se agrego lectura y validacion de query param returnTo.
- Se incorporo boton Volver a mi tirada actual cuando aplica.

## Trazabilidad contra requerimientos

Requerimiento 1:
Mostrar significado al hacer clic sin salir de la pagina.
Estado: Cumplido.
Evidencia: Modal de significado en la pagina de tirada.

Requerimiento 2:
Si hay navegacion separada, permitir regreso claro a la tirada actual.
Estado: Cumplido.
Evidencia: returnTo y boton Volver a mi tirada actual en detalle.

Requerimiento 3:
Persistir tirada hasta cerrar o generar nueva.
Estado: Cumplido.
Evidencia: Estado en localStorage, restauracion automatica y limpieza controlada.

## Validacion tecnica
Se ejecuto build de produccion de Astro despues de los cambios.
Resultado: compilacion correcta sin errores.

## Pruebas manuales sugeridas
1. Generar tirada, revelar cartas y abrir significado: verificar permanencia en la misma pantalla.
2. Desde modal, ir a ficha completa y volver con boton dedicado: verificar restauracion exacta de la lectura.
3. Recargar navegador en mitad de lectura: verificar restauracion de cartas y orden.
4. Pulsar Limpiar: verificar reinicio total y borrado de persistencia.
5. Generar nueva tirada con Barajar: verificar reemplazo de lectura anterior.

## Consideraciones de seguridad y UX
- Se valida returnTo para evitar redirecciones no deseadas.
- Se conserva acceso a ficha completa para usuarios que quieren mayor detalle.
- Se prioriza continuidad de experiencia de lectura en el flujo principal.

## Resumen ejecutivo
La implementacion corrige la perdida de contexto en tiradas, habilita consulta de significado sin navegar fuera, ofrece retorno explicito cuando se visita el detalle y asegura persistencia de lectura hasta accion del usuario. Con esto, la experiencia de tirada queda coherente, estable y alineada con los requisitos solicitados.
