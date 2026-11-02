# DULZARA - Tienda de Belleza y Cuidado Personal

Tienda virtual moderna para **DULZARA**, especializada en maquillaje, cuidado facial y belleza en Barranquilla y toda Colombia.

## 🚀 Características
- **Catálogo en tiempo real:** Sincronizado con Google Cloud Firestore.
- **Carrito y Checkout WhatsApp:** Pedidos automáticos con cálculo de envío y mensaje listo para despachar.
- **Panel Administrativo:**
  - Login seguro con correo y contraseña.
  - Control de pedidos (cambio a confirmado descuenta inventario automáticamente).
  - Gestión y edición de productos y stock en tiempo real.
  - Configuración de tienda (umbral dinámico de envío gratis, Instagram `@dulzara_bq`, ciudad de origen).
- **Cero Costos de Infraestructura ($0 COP).**

## 🌐 Despliegue en GitHub Pages (Automático)
Este repositorio incluye un flujo de trabajo de GitHub Actions en `.github/workflows/deploy.yml`:
1. Sube este código a tu repositorio de GitHub en la rama `main`.
2. En tu repositorio, ve a **Settings** > **Pages**.
3. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
4. ¡El despliegue se ejecutará automáticamente y te entregará tu enlace público web!

## ⚡ Despliegue en Vercel (Recomendado - 30 segundos)
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New** > **Project** e importa este repositorio.
3. Haz clic en **Deploy** (los valores por defecto de Vite ya están listos).
4. Obtendrás un enlace público `https://dulzara.vercel.app` de alta velocidad y 100% gratuito.
