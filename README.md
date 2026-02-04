# Control

Una compañera empática para construir hábitos sin culpa.

## Descripción

Control es una web app basada en "Hábitos Atómicos" de James Clear, diseñada para ser una compañera empática para personas con bloqueos mentales, ansiedad o culpa al mantener hábitos.

## Características

- Enfoque empático y sin culpa
- Acciones mínimas adaptadas a tu nivel de energía
- Diseño minimalista en tonos morados oscuros
- Persistencia local con localStorage
- Responsive y PWA-ready (instalable en móvil)
- Rachas humanas que no se rompen

## Desarrollo

### Instalación

```bash
npm install
```

### Ejecutar en desarrollo

Desde la **raíz del proyecto** (donde está `package.json`):

```bash
npm install
cd server && npm install && cd ..
npm run dev
```

Esto levanta **frontend (Vite)** y **backend (Node)** a la vez. En la terminal verás algo como:

- **Frontend:** `Local: http://localhost:3001/` (o 3002 si 3001 está ocupado)
- **Backend:** `Server running at http://localhost:4001` (o 4002 si 4001 está ocupado)

**Abrí en el navegador la URL del frontend** (la que dice Vite). Si ves "ERR_CONNECTION_REFUSED", es que ningún servidor está escuchando en ese puerto: asegurate de haber ejecutado `npm run dev` y de no haber cerrado la terminal.

### Build para producción

```bash
npm run build
```

### Preview de producción

```bash
npm run preview
```

## Tecnologías

- React 18
- Vite
- CSS puro (sin frameworks)

## Estructura del proyecto

```
src/
  components/    # Componentes React
  hooks/        # Custom hooks
  utils/        # Funciones auxiliares
  data/         # Datos estáticos
  styles/       # Estilos globales
public/
  manifest.json  # Configuración PWA
  icon-*.svg     # Iconos de la app
```

## PWA (Progressive Web App)

La app está configurada como PWA y puede instalarse en dispositivos móviles:

- **En Android/Chrome**: Abre el menú y selecciona "Agregar a pantalla de inicio"
- **En iOS/Safari**: Toca el botón de compartir y selecciona "Agregar a pantalla de inicio"

Una vez instalada, la app funcionará como una app nativa con:
- Icono en la pantalla de inicio
- Modo standalone (sin barra del navegador)
- Persistencia de datos local

## Deploy

### Vercel (Recomendado)

1. **Instalar Vercel CLI** (opcional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy desde la terminal**:
   ```bash
   vercel
   ```
   O simplemente conecta tu repositorio en [vercel.com](https://vercel.com)

3. **Configuración automática**:
   - Vercel detecta automáticamente Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Netlify

1. **Instalar Netlify CLI** (opcional):
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy desde la terminal**:
   ```bash
   netlify deploy --prod
   ```

3. **O desde la web**:
   - Conecta tu repositorio en [netlify.com](https://netlify.com)
   - Build command: `npm run build`
   - Publish directory: `dist`

### Variables de entorno

**Frontend (raíz del proyecto)**  
- `VITE_API_URL`: URL del backend. En desarrollo, si no se define, se usa `http://localhost:4000`. En producción, configurarla con la URL del backend (ej. `https://api.tudominio.com`). Copiar `.env.example` a `.env` y ajustar si hace falta.

**Backend (carpeta `server/`)**  
- Ver `server/.env.example`: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`. Copiar a `server/.env` y rellenar con valores reales. **No subir `.env` al repositorio** (está en `.gitignore`).

**Envío de email al correo real (Olvidé mi contraseña)**  
Para que el usuario reciba el mensaje de restablecer contraseña en su correo, configurá en `server/.env` las variables de email (ver bloque "EMAIL" en `server/.env.example`). Necesitás al menos: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` y opcionalmente `RESET_PASSWORD_LINK_BASE` (URL de tu app, para que el link del email abra directo la pantalla de nueva contraseña). Con Gmail: usar una [contraseña de aplicación](https://support.google.com/accounts/answer/185833) en `SMTP_PASS`, no la contraseña normal. Reiniciá el servidor después de cambiar `.env`.

## Si ves "La página ha rechazado la conexión" (ERR_CONNECTION_REFUSED)

1. **¿Ejecutaste el proyecto?** En la raíz del proyecto ejecutá `npm run dev`. No cierres esa terminal.
2. **¿Qué URL abrís?** Tenés que abrir la URL del **frontend** que muestra Vite en la terminal (ej. `http://localhost:3001` o `http://localhost:3002`). No uses solo `http://localhost` sin puerto.
3. **Si cerraste la terminal:** Volvé a ejecutar `npm run dev` y esperá a que aparezcan las dos líneas (Vite + Server). Luego abrí la URL que indica Vite.

## Pruebas

### Flujo completo de la app

1. **Selección de nivel de energía**:
   - Abrir la app
   - Ver selector con 4 niveles
   - Seleccionar un nivel
   - Verificar que se guarde en localStorage

2. **Pantalla de acción**:
   - Ver acción aleatoria del nivel seleccionado
   - Ver botones "Hacerlo más chico" y "Listo"
   - Ver racha (si existe)

3. **Reducir acción**:
   - Click en "Hacerlo más chico"
   - Verificar que la acción se reduzca o cambie a nivel anterior

4. **Completar acción**:
   - Click en "Listo"
   - Ver mensaje "Hecho" y pregunta "¿Seguimos o alcanza por hoy?"

5. **Flujo "una más"**:
   - Click en "Una más"
   - Ver nueva acción similar
   - Completar varias acciones
   - Verificar que todas se guarden

6. **Terminar por hoy**:
   - Después de completar una acción, click en "Terminar por hoy"
   - Ver mensaje "Con esto alcanza. Mañana seguimos."

7. **Rachas**:
   - Completar acciones en días consecutivos
   - Verificar que la racha se incremente
   - Probar pausar/reanudar racha
   - Verificar que la racha no se rompe fácilmente

8. **Persistencia**:
   - Completar acciones
   - Recargar la página
   - Verificar que el estado se mantenga
   - Verificar en DevTools → Application → Local Storage

### Pruebas en diferentes dispositivos

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Móvil**: Chrome (Android), Safari (iOS)
- **Tablet**: Verificar responsive en diferentes tamaños

### Verificación PWA

1. Build de producción: `npm run build`
2. Preview: `npm run preview`
3. En Chrome DevTools:
   - Application → Manifest (verificar configuración)
   - Lighthouse → PWA (auditoría)
4. En móvil: Instalar como PWA y verificar funcionamiento
