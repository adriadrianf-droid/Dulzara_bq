# Plan de Arquitectura y Centralización de Datos — DULZARA

Plan técnico integral para transformar la tienda virtual DULZARA de un almacenamiento local en el navegador a una arquitectura centralizada en la nube mediante Cloud Firestore y Firebase Authentication bajo el plan gratuito Spark ($0 COP), preservando completamente el diseño, catálogo, carrito y checkout por WhatsApp.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> A continuación se detallan las decisiones clave confirmadas para la ejecución técnica:

- **Almacenamiento Centralizado**: Se utilizará **Cloud Firestore** bajo la cuota gratuita del plan **Spark** (1 GB de almacenamiento, 50.000 lecturas diarias, 20.000 escrituras diarias), garantizando $0 COP de costo.
- **Autenticación Administrativa**: Se implementará **Firebase Authentication** eliminando las credenciales fijas del código fuente y restringiendo el acceso del panel mediante roles y reglas de seguridad de Firestore (`firestore.rules`).
- **Política de Inventario y Pedidos**: El stock **no se descontará al pulsar WhatsApp**, evitando bloqueos por carritos o conversaciones abandonadas. El descuento de existencias ocurrirá exclusivamente cuando el administrador cambie el estado del pedido a **"Confirmado"** o **"Preparando"** en el panel administrativo.
- **Migración sin Pérdida**: Se implementará un mecanismo de auto-siembra (*seed migration*) que trasladará el catálogo existente de 10 productos hacia Firestore en el primer arranque del administrador si la colección está vacía.

---

## 1. Overview & Core Concept

* **Propósito**: Permitir que los clientes en cualquier dispositivo (computadores, teléfonos móviles) consulten un catálogo en tiempo real con existencias reales actualizadas desde la nube, y que los pedidos generados lleguen de forma centralizada al panel administrativo del comerciante.
* **Presupuesto y Costos**: Exactamente **$0 COP**. No se activará Google Cloud Billing, no se requerirá tarjeta de crédito, y no se sobrepasarán las cuotas del plan Spark.
* **Integración con WhatsApp**: Se mantiene idéntica la experiencia de compra sin registro y la generación del mensaje estructurado para WhatsApp con verificación previa de precios canónicos.

---

## 2. User Experience & Visual Design

* **Fidelidad Visual Absoluta**: Se mantiene al 100% la paleta de colores (`#F7E5E9`, `#E8BFCB`, `#B9788B`, `#FFFDF9`, `#382A30`), tipografía (*Playfair Display* y *Plus Jakarta Sans*), componentes de catálogo, bolsa deslizable, y diseño responsive móvil.
* **Flujo del Comprador**:
  1. El cliente explora el catálogo público (lectura en tiempo real o en caché de Firestore).
  2. Agrega productos a la bolsa (estado local en el cliente para máxima velocidad).
  3. Diligencia el formulario de envío (ciudades de Colombia, dirección y teléfono).
  4. Presiona **FINALIZAR PEDIDO POR WHATSAPP**:
     - El pedido se registra en Firestore en la colección `/orders` con estado inicial `pendiente`.
     - Se abre el enlace directo de WhatsApp con el mensaje estructurado y número de orden.
     - Se muestra la pantalla de confirmación.
* **Flujo del Administrador**:
  1. El administrador ingresa a `/admin` o mediante el botón en el encabezado.
  2. Inicia sesión mediante Firebase Auth con correo y contraseña protegidos (sin credenciales expuestas en el código).
  3. Visualiza los pedidos entrantes de todos los clientes en tiempo real.
  4. Al pulsar **"Confirmar Pedido"**, el sistema descuenta automáticamente el inventario en Firestore mediante una transacción atómica segura.

---

## 3. Key Product Decisions & Trade-Offs

* **Decisión 1: Descuento de existencias al confirmar (No al generar WhatsApp)**
  * *Estrategia elegida*: El pedido se crea como `pendiente` sin alterar el stock. Solo al cambiar a `confirmado` se descuenta del inventario.
  * *Razón*: En ventas asistidas por WhatsApp en Colombia, un porcentaje de usuarios abre el chat pero no concreta la compra. Descontar stock inmediatamente causaría "inventario fantasma" o agotamiento artificial de productos.
* **Decisión 2: Capa Híbrida de Servicio (StoreService Abstraction)**
  * *Estrategia elegida*: Mantener la interfaz de `storeService` pero sustituyendo internamente las llamadas a `localStorage` por operaciones de Firestore con fallback defensivo.
  * *Razón*: Evita reescribir `App.tsx`, `ProductCard.tsx` y `CartDrawer.tsx`, minimizando riesgos de regresión visual o lógica.
* **Decisión 3: Modo Solo-Lectura Público sin Cuenta**
  * *Estrategia elegida*: Reglas de seguridad que permiten lectura pública de `/products` y creación pública de `/orders`, pero lectura y modificación de pedidos reservada exclusivamente para el administrador autenticado.

---

## 4. Technical Architecture & Data Strategy

### A. Arquitectura Actual vs. Arquitectura Propuesta

```
ARQUITECTURA ACTUAL (Aislada por navegador):
┌───────────────────────── Navegador Cliente ─────────────────────────┐
│  React UI ──> StoreService ──> localStorage ['dulzara_products_v1']  │
│                                    └──> localStorage ['dulzara_orders_v1']    │
└───────────────────────────────────────────────────────────────────────┘
                                   ▲ (Sin conexión entre usuarios)
┌─────────────────────── Navegador Administrador ─────────────────────┐
│  AdminPanel ──> AuthService ──> localStorage ['dulzara_session']    │
│  (Credenciales fijas en código)                                     │
└───────────────────────────────────────────────────────────────────────┘

ARQUITECTURA PROPUESTA (Centralizada en la Nube con $0 COP):
┌─────────────────────────── Navegador Cliente ──────────────────────────┐
│  React UI (Sin cuenta)                                                 │
│    ├── Lectura Catálogo ───────> Firestore: /products (Público)        │
│    ├── Bolsa de compras ───────> Estado Local (Rápido y fluido)        │
│    └── Finalizar WhatsApp ─────> Firestore: /orders (Escritura segura) │
│                                  └──> Abre chat WhatsApp (wa.me)       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                             Google Cloud Firestore
                             (Plan Gratuito Spark)
                                     │
┌────────────────────── Navegador Administrador ─────────────────────────┐
│  Firebase Authentication (Email / Password Seguro en la Nube)          │
│    ├── Panel de Control ───────> Firestore: /orders (Lectura en vivo)  │
│    ├── Confirmar Pedido ───────> Transacción: Actualiza stock producto │
│    └── Gestión Catálogo ───────> Firestore: /products (CRUD admin)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### B. Archivos que tendrían que modificarse

1. `package.json`: Incorporar la dependencia oficial de Firebase (`firebase`).
2. `src/services/storeService.ts`: Migrar métodos de lectura/escritura (`getProducts`, `addProduct`, `updateProduct`, `createOrder`, `updateOrderStatus`) para operar asíncronamente con Firestore.
3. `src/services/authService.ts`: Reemplazar la validación fija en memoria por `signInWithEmailAndPassword`, `signOut` y observador `onAuthStateChanged` del SDK de Firebase Auth.
4. `src/components/AdminLoginModal.tsx`: Conectar la autenticación asíncrona real y mostrar mensajes de error de Firebase (ej: usuario no encontrado, contraseña incorrecta).
5. `src/components/AdminPanel.tsx`: Integrar escucha en tiempo real (`onSnapshot`) para pedidos y productos, y disparar el descuento de existencias al confirmar.
6. `src/App.tsx`: Adaptar la carga inicial a promesas/subscripciones reactivas de Firestore.

---

### C. Nuevos Archivos Necesarios

1. `src/lib/firebase.ts`: Inicialización del SDK de Firebase usando la configuración del proyecto (`firebase-applet-config.json`).
2. `firebase-blueprint.json`: Especificación intermedia de entidades (`products`, `orders`, `settings`) requerida para la arquitectura de reglas.
3. `firestore.rules`: Reglas de seguridad estrictas que impiden a usuarios no autorizados modificar precios o consultar pedidos ajenos.

---

### D. Migración de Datos de localStorage sin Perder el Catálogo

* Al inicializar la conexión con Firestore, `storeService` ejecutará una comprobación inicial (`checkAndSeedCatalog`):
  * Consulta si la colección `/products` contiene documentos.
  * Si está vacía (primer despliegue), sube de forma automática los 10 productos de belleza iniciales de Dulzara con sus descripciones, precios en COP, categorías e imágenes.
  * Si ya existen datos en Firestore, los consume directamente, asegurando que cualquier cambio que el administrador haga en el panel persista para siempre.

---

### E. Implementación de Autenticación Administrativa Segura

1. Se creará una cuenta de administrador en Firebase Authentication (correo verificado de la tienda).
2. Se eliminará la constante de contraseña del código fuente del frontend.
3. El frontend invocará `signInWithEmailAndPassword(auth, email, password)`.
4. Las reglas de Firestore verificarán el UID del usuario contra la colección restringida de administradores (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))`).
5. Ningún usuario no autenticado podrá acceder a la lista de pedidos ni a la modificación de existencias.

---

### F. Protección de Operaciones de Inventario y Pedidos

1. **Creación de Pedidos**: Los clientes públicos pueden escribir en `/orders/{orderId}`, pero únicamente pueden crear documentos con estado `pendiente` y con validación de campos obligatorios (nombre, teléfono, dirección, ciudad).
2. **Validación de Precios**: La orden se valida comparando los precios solicitados contra los documentos de `/products`.
3. **Descuento de Stock Seguro**: El inventario solo se descuenta mediante una transacción de Firestore (`runTransaction`) ejecutada cuando el administrador cambia el estado a `confirmado`. Si dos administradores o procesos intentan modificar el stock simultáneamente, la transacción garantiza integridad atómica.

---

### G. Prevención de Costos de Infraestructura ($0 COP)

* **Plan Spark de Firebase**: Incluye cuotas gratuitas generosas y permanentes:
  * Lecturas de Firestore: **50.000 documentos/día** (suficiente para miles de visitas diarias con caché).
  * Escrituras de Firestore: **20.000 documentos/día**.
  * Almacenamiento: **1 GB** (suficiente para más de 50.000 pedidos y productos en texto/JSON).
  * Autenticación: Usuarios ilimitados por correo/contraseña.
* **Límite Estricto**: Al no asociar tarjeta de crédito ni habilitar el plan Blaze, Google no puede generar facturación bajo ninguna circunstancia. Si en algún momento se alcanzara el límite diario, Firebase simplemente detiene las consultas hasta el día siguiente en lugar de cobrar.
* **Optimización de Lecturas**: Uso de estado local en React para la navegación y paginación eficiente para no gastar cuota innecesariamente.

---

### H. Limitaciones de la Solución Gratuita

1. **Fotografías por URL**: Dado que no se utilizará almacenamiento de pago (Cloudinary o Firebase Storage con tarjeta), las fotos de productos deben seguir alojándose mediante URLs públicas accesibles (como enlaces web o servicios de alojamiento de imágenes gratuitos).
2. **Cuota de 50.000 lecturas/día**: En caso de que la tienda supere 50.000 visitas con consultas masivas en un solo día, las lecturas se pausarán temporalmente hasta la medianoche (horario del servidor de Google).
3. **Notificaciones Push**: No se incluyen envíos automatizados de SMS o notificaciones push pagadas; la confirmación y comunicación directa se realiza a través de WhatsApp Web/Móvil con costo $0.
