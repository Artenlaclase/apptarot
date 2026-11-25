# Documento de Cambios - Arcano Personal

Fecha: 2026-06-15
Proyecto: apptarot

## 1. Objetivo general

Se implementó y refinó la funcionalidad de Arcano Personal dentro del flujo de registro y perfil del usuario.

El objetivo fue:

- calcular automáticamente el Arcano Personal a partir de la fecha de nacimiento;
- guardar el resultado en Firestore;
- mostrar la carta y el resumen espiritual dentro del perfil;
- permitir recalcular el arcano desde el perfil;
- mejorar la experiencia de captura de nombre, apellido y fecha;
- corregir errores de persistencia cuando el guardado se hacía desde el perfil.

## 2. Criterio de cálculo implementado

La lógica final adoptada sigue el criterio validado por el usuario:

1. Se toma la fecha de nacimiento en formato `DD/MM/AAAA`.
2. Se calcula `día + mes + año`.
3. Si el resultado es `21` o menor, ese número es el Arcano Mayor final.
4. Si el resultado es mayor que `21`, se reducen los dígitos del valor resultante.
5. Se repite la reducción hasta obtener un valor entre `1` y `21`.

### Ejemplo validado

Fecha: `10/03/1979`

- `10 + 03 + 1979 = 1992`
- `1 + 9 + 9 + 2 = 21`
- Resultado final: `21` → `El Mundo`

## 3. Archivos creados o modificados

### 3.1 Lógica de cálculo

Archivo: `src/lib/arcaneCalculator.ts`

Cambios realizados:

- se consolidó el mapa de Arcanos Mayores del `1` al `21`;
- se corrigió la fórmula para usar `día + mes + año` en lugar de sumar todos los dígitos de la fecha por separado;
- se agregó una función de reducción numérica para bajar el resultado hasta el rango válido;
- se agregó `getPersonalArcaneBreakdown()` para generar los pasos del cálculo y poder mostrarlos en la interfaz del perfil;
- se mantuvieron validaciones para nombre, fecha y hora.

Funciones relevantes:

- `calculatePersonalArcane()`
- `getPersonalArcaneBreakdown()`
- `validateFullName()`
- `validateBirthDate()`
- `validateBirthHour()`
- `normalizeBirthDateInput()`

## 4. Componente reutilizable de captura de datos

Archivo: `src/components/PersonalArcaneCalculator.astro`

Cambios realizados:

- se reemplazó el campo único de nombre completo por dos campos separados:
  - `Nombre`
  - `Apellido`
- se agregó un campo oculto con el nombre completo combinado para reutilización interna del formulario;
- el campo de fecha pasó a usar `type="date"` para permitir seleccionar la fecha con el calendario del navegador;
- se mantiene el campo opcional de hora de nacimiento;
- se conserva la previsualización del Arcano Personal en tiempo real;
- se despachan eventos con:
  - `firstName`
  - `lastName`
  - `fullName`
  - `birthDate`
  - `birthHour`
  - `number`
  - `name`

Mejoras UX:

- labels más claros;
- separación visual entre nombre y apellido;
- ayuda contextual para la fecha de nacimiento;
- experiencia más cómoda al elegir la fecha.

## 5. Cambios en registro

Archivo: `src/pages/auth/register.astro`

Cambios realizados:

- se adaptó el formulario para usar el nuevo formato de nombre/apellido desde el componente `PersonalArcaneCalculator`;
- se añadió una caja visual específica para los datos del Arcano Personal dentro del registro;
- se mejoró el texto explicativo de la pantalla;
- el script ahora combina `Nombre + Apellido` antes de validar y guardar;
- se mantiene el guardado del Arcano Personal al crear la cuenta.

Campos guardados durante el registro:

- `fullName`
- `displayName`
- `birthDate`
- `birthHour`
- `personalArcaneNumber`
- `personalArcaneName`
- `personalArcaneMeaning`
- `personalArcaneCalculatedAt`
- `updatedAt`

Resultado funcional:

- el usuario sale del registro con el perfil listo y con su Arcano Personal guardado.

## 6. Cambios en perfil

Archivo: `src/pages/profile.astro`

Cambios realizados:

- la cabecera del perfil se reorganizó para dejar la carta del Arcano Personal al lado del resumen del perfil;
- se agregó una tabla de reducción del cálculo debajo de la carta;
- se eliminó la edición de nombre separada fuera del bloque de Arcano Personal;
- el bloque de Arcano Personal ahora contiene directamente:
  - `Nombre`
  - `Apellido`
  - `Fecha de nacimiento`
  - `Hora de nacimiento`
- el usuario puede recalcular el Arcano Personal desde el mismo bloque donde edita su identidad básica.

Visualmente, el perfil ahora muestra:

- carta del arcano personal;
- nombre del arcano;
- número del arcano;
- resumen espiritual;
- desglose del cálculo por pasos.

## 7. Corrección del guardado en perfil

Problema detectado:

El botón `Guardar Arcano Personal` no persistía cambios de forma confiable en algunos casos, y por eso no se actualizaban la imagen de la carta ni el resumen espiritual después de guardar.

Causa raíz:

El guardado desde el perfil dependía de `auth.currentUser` del cliente Firebase. Aunque el usuario tuviera sesión SSR válida, el estado cliente podía no estar listo o no existir en ese momento.

Solución aplicada:

Se creó un endpoint de servidor dedicado para actualizar el perfil del usuario usando la sesión del servidor.

Archivo nuevo: `src/pages/api/user/profile.ts`

Este endpoint:

- valida la sesión con `verifySessionCookieFromRequest()`;
- recibe `firstName`, `lastName`, `birthDate`, `birthHour`;
- compone `fullName`;
- valida nombre, fecha y hora;
- recalcula el Arcano Personal si corresponde;
- guarda la información en Firestore con Firebase Admin.

Resultado:

- el guardado del Arcano Personal ya no depende del estado de Firebase Auth en cliente;
- la actualización del perfil es más robusta;
- al recargar, la carta, la imagen y el resumen espiritual aparecen correctamente porque el SSR lee datos ya persistidos.

## 8. Endpoint nuevo de actualización de perfil

Archivo: `src/pages/api/user/profile.ts`

Responsabilidad:

- actualizar nombre del usuario;
- actualizar fecha y hora de nacimiento;
- recalcular y guardar Arcano Personal;
- usar sesión de servidor segura.

Flujo del endpoint:

1. Verifica sesión del usuario.
2. Lee payload JSON.
3. Valida nombre completo compuesto desde nombre y apellido.
4. Valida fecha y hora.
5. Calcula el Arcano Personal si hay fecha.
6. Guarda cambios en `users/{uid}`.
7. Devuelve respuesta JSON.

## 9. Reglas y seguridad

Archivo relacionado: `firestore.rules`

Cambios ya aplicados previamente y mantenidos:

- solo el propietario puede leer/escribir su documento;
- validación de rango para `personalArcaneNumber`;
- validación de formato para `birthDate`;
- validación de formato para `birthHour`;
- validación de nombres de arcanos permitidos.

Esto asegura que el documento del usuario conserve coherencia estructural.

## 10. Integración con la UI del perfil

Datos mostrados en el perfil:

- nombre del usuario;
- plan actual;
- cantidad de tiradas guardadas;
- carta del Arcano Personal;
- nombre y número del Arcano Personal;
- mensaje espiritual resumido;
- tabla de reducción del cálculo.

La tabla de cálculo muestra columnas:

- Día
- Mes
- Año
- =
- Reducción

Esto permite al usuario entender de forma transparente cómo se obtuvo el resultado.

## 11. Mejoras de UX introducidas

### Registro

- nombre y apellido separados;
- mejor jerarquía visual del bloque de Arcano Personal;
- fecha seleccionable con calendario del navegador;
- mensajes más claros.

### Perfil

- edición de nombre integrada directamente al bloque del Arcano Personal;
- corrección del guardado;
- visualización del proceso matemático;
- coherencia entre cálculo, imagen y resumen.

## 12. Compatibilidad con la estructura existente

La implementación se integró respetando la arquitectura existente:

- Astro para páginas y SSR;
- Firebase Auth para autenticación;
- Firestore para persistencia;
- Firebase Admin para lectura/escritura segura en servidor;
- Tailwind y estilos ya existentes del proyecto.

No se reemplazó el flujo principal de autenticación.
Se reforzó el guardado del perfil donde era necesario.

## 13. Validación técnica realizada

Después de los cambios se ejecutó validación mediante:

- revisión de errores de tipos en archivos modificados;
- compilación completa con `npm run build`.

Estado final:

- sin errores de editor en los archivos tocados;
- build completo exitoso.

## 14. Estado funcional final

Al terminar esta iteración, el sistema queda así:

### En registro

- el usuario ingresa nombre, apellido, fecha, hora opcional, email y contraseña;
- el sistema calcula y guarda el Arcano Personal al crear la cuenta;
- se muestra mensaje de felicitación con el arcano resultante.

### En perfil

- se muestra la carta del Arcano Personal;
- se muestra el resumen espiritual;
- se muestra el desglose del cálculo;
- el usuario puede editar nombre/apellido dentro del mismo bloque del Arcano Personal;
- el usuario puede cambiar fecha/hora y recalcular;
- el guardado persiste correctamente en Firestore a través de servidor.

## 15. Próximos pasos recomendados

1. Mostrar el desglose del cálculo también en la pantalla de registro después del alta.
2. Refrescar el bloque de carta/resumen en caliente tras guardar, sin esperar recarga completa.
3. Guardar `firstName` y `lastName` por separado en Firestore si se quiere usarlos en otras experiencias futuras.
4. Añadir pruebas automatizadas para la fórmula del arcano y para el endpoint `api/user/profile`.
