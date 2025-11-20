# Pasos para Hostear tu Proyecto

## ✅ Paso 1: Subir código a GitHub (Ya hecho - Git inicializado)

### 1.1. Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio:
   - **Repository name**: `plataforma-cursos` (o el nombre que prefieras)
   - **Visibility**: Puede ser **Private** o **Public**
   - **NO marques** "Initialize this repository with a README"
3. Haz clic en **"Create repository"**

### 1.2. Conectar y subir tu código

En tu terminal, ejecuta estos comandos (reemplaza `TU_USUARIO` y `TU_REPOSITORIO` con los tuyos):

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

**Ejemplo:**
```bash
git branch -M main
git remote add origin https://github.com/juanperez/plataforma-cursos.git
git push -u origin main
```

---

## ✅ Paso 2: Hostear Backend en Render.com (Gratis)

### 2.1. Crear cuenta en Render

1. Ve a https://render.com
2. Haz clic en **"Get Started for Free"**
3. Regístrate con tu cuenta de **GitHub** (recomendado)

### 2.2. Crear Web Service

1. En el Dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio de GitHub:
   - Si es la primera vez, autoriza a Render a acceder a tus repositorios
   - Selecciona tu repositorio `plataforma-cursos`

### 2.3. Configurar el servicio

Completa estos campos:

- **Name**: `plataforma-cursos-backend` (o el nombre que prefieras)
- **Environment**: `Node`
- **Region**: Elige la más cercana a ti (ej: `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: (déjalo vacío)
- **Build Command**: `npm install`
- **Start Command**: `node server/index.js`
- **Plan**: `Free`

### 2.4. Configurar Variables de Entorno

En la sección **"Environment Variables"**, haz clic en **"Add Environment Variable"** y agrega:

1. **DATABASE_URL**:
   ```
   postgresql://postgres.dkqqvljftdtledrzpqig:James1003221384.%40@aws-1-us-east-2.pooler.supabase.com:6543/postgres
   ```
   (Esta es tu connection string del Transaction Pooler de Supabase)

2. **JWT_SECRET**:
   ```
   tu_secreto_jwt_muy_seguro_cambiar_en_produccion_123456789
   ```
   (Cambia esto por una clave secreta segura y única)

3. **PORT**: (déjalo vacío - Render lo configura automáticamente)

### 2.5. Desplegar

1. Haz clic en **"Create Web Service"**
2. Espera a que se despliegue (puede tardar 5-10 minutos)
3. Una vez desplegado, copia la URL que te da Render
   - Ejemplo: `https://plataforma-cursos-backend.onrender.com`
   - **Guarda esta URL**, la necesitarás para el frontend

### 2.6. Verificar que funciona

1. Abre la URL de tu backend en el navegador
2. Deberías ver: `{"message":"API funcionando correctamente"}`
3. Si ves esto, tu backend está funcionando ✅

---

## ✅ Paso 3: Hostear Frontend en Vercel (Gratis)

### 3.1. Crear cuenta en Vercel

1. Ve a https://vercel.com
2. Haz clic en **"Sign Up"**
3. Regístrate con tu cuenta de **GitHub** (recomendado)

### 3.2. Importar proyecto

1. En el Dashboard de Vercel, haz clic en **"Add New..."**
2. Selecciona **"Project"**
3. Importa tu repositorio de GitHub:
   - Selecciona tu repositorio `plataforma-cursos`
   - Si es la primera vez, autoriza a Vercel

### 3.3. Configurar el proyecto

Completa estos campos:

- **Framework Preset**: `Create React App`
- **Root Directory**: `client` ⚠️ **IMPORTANTE**: Cambia esto a `client`
- **Build Command**: `npm run build` (debería aparecer automáticamente)
- **Output Directory**: `build` (debería aparecer automáticamente)

### 3.4. Configurar Variables de Entorno

En la sección **"Environment Variables"**, haz clic en **"Add"** y agrega:

- **Name**: `REACT_APP_API_URL`
- **Value**: La URL de tu backend en Render
  - Ejemplo: `https://plataforma-cursos-backend.onrender.com`
  - **NO incluyas** la barra final `/`

### 3.5. Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que se despliegue (puede tardar 2-5 minutos)
3. Una vez desplegado, copia la URL que te da Vercel
   - Ejemplo: `https://plataforma-cursos.vercel.app`
   - Esta es la URL de tu aplicación en producción ✅

---

## ✅ Paso 4: Configurar Supabase Storage (para imágenes)

### 4.1. Crear buckets en Supabase

1. Ve a tu proyecto en Supabase
2. En el menú lateral, haz clic en **"Storage"**
3. Haz clic en **"Create a new bucket"**
4. Crea estos 3 buckets (uno por uno):

   **Bucket 1:**
   - **Name**: `profiles`
   - **Public bucket**: ✅ **Marca esta casilla**
   - Haz clic en **"Create bucket"**

   **Bucket 2:**
   - **Name**: `courses`
   - **Public bucket**: ✅ **Marca esta casilla**
   - Haz clic en **"Create bucket"**

   **Bucket 3:**
   - **Name**: `modulos`
   - **Public bucket**: ✅ **Marca esta casilla**
   - Haz clic en **"Create bucket"**

### 4.2. Configurar políticas públicas

Para cada bucket (`profiles`, `courses`, `modulos`):

1. Haz clic en el nombre del bucket
2. Ve a la pestaña **"Policies"**
3. Haz clic en **"New Policy"**
4. Selecciona **"Create a policy from scratch"**
5. Configura:
   - **Policy name**: `Public Access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: `true`
6. Haz clic en **"Review"** y luego en **"Save policy"**

---

## ✅ Paso 5: Verificar que todo funciona

1. Abre la URL de Vercel en tu navegador
2. Deberías ver tu aplicación funcionando
3. Prueba:
   - Crear un curso
   - Subir una imagen
   - Verificar que se guarde en Supabase

---

## 🔧 Solución de Problemas

### El backend no se conecta a Supabase

- Verifica que `DATABASE_URL` en Render tenga el connection string correcto
- Asegúrate de usar el **Transaction Pooler** (puerto 6543)
- Verifica que tu proyecto de Supabase esté activo

### El frontend no se conecta al backend

- Verifica que `REACT_APP_API_URL` en Vercel tenga la URL correcta de Render
- **NO incluyas** la barra final `/` en la URL
- Verifica que el backend esté funcionando (abre la URL de Render en el navegador)

### Render tarda mucho en responder

- El plan gratuito de Render "duerme" el servidor después de 15 minutos de inactividad
- La primera petición después de dormir puede tardar ~30 segundos
- Esto es normal en el plan gratuito

### Las imágenes no se suben

- Verifica que los buckets en Supabase estén creados y sean públicos
- Verifica que las políticas públicas estén configuradas
- Por ahora, las imágenes se suben al servidor de Render. Para producción, considera migrar a Supabase Storage.

---

## 📝 Notas Importantes

- **Nunca subas el archivo `.env` a GitHub** (ya está en `.gitignore`)
- **Cambia el `JWT_SECRET`** por una clave secreta segura y única
- **El plan gratuito de Render** puede tener limitaciones de velocidad
- **Las imágenes se guardan en Render** por ahora. Para producción, considera usar Supabase Storage directamente.

---

¡Listo! Tu aplicación debería estar funcionando en producción 🎉

