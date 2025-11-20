# Guía de Hosting - Supabase + GitHub

## Paso 1: Obtener la cadena de conexión de Supabase

1. Ve a tu proyecto en Supabase
2. En el menú lateral, haz clic en **"Settings"** (Configuración)
3. Luego haz clic en **"Database"**
4. Busca la sección **"Connection string"** o **"Connection pooling"**
5. Selecciona **"URI"** o **"Connection string"**
6. Copia la cadena que se ve así:
   ```
   postgresql://postgres:[TU_PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
7. Reemplaza `[TU_PASSWORD]` con la contraseña de tu base de datos (la que configuraste al crear el proyecto)

## Paso 2: Configurar variables de entorno localmente

1. En la raíz del proyecto, crea un archivo llamado `.env`
2. Agrega esta línea (reemplaza con tu connection string real):
   ```
   DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui
   PORT=5000
   ```

## Paso 3: Instalar dependencias de PostgreSQL

Ejecuta en la terminal:
```bash
npm install
```

Esto instalará `pg` (PostgreSQL) además de las dependencias existentes.

## Paso 4: Probar localmente

1. Inicia el servidor:
   ```bash
   npm run server
   ```

2. Deberías ver: `✅ Conexión a PostgreSQL (Supabase) establecida correctamente`

## Paso 5: Subir código a GitHub

1. Si no tienes un repositorio en GitHub, créalo:
   - Ve a https://github.com/new
   - Crea un nuevo repositorio (puede ser privado)

2. En tu terminal, ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Primer commit - Proyecto listo para hosting"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

## Paso 6: Hostear el Backend (Render.com - Gratis)

1. Ve a https://render.com y crea una cuenta (puedes usar GitHub)

2. Haz clic en **"New +"** → **"Web Service"**

3. Conecta tu repositorio de GitHub

4. Configura el servicio:
   - **Name**: `plataforma-cursos-backend` (o el nombre que prefieras)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: Free

5. En **"Environment Variables"**, agrega:
   - `DATABASE_URL`: (tu connection string de Supabase)
   - `JWT_SECRET`: (una clave secreta segura)
   - `PORT`: `10000` (Render usa este puerto automáticamente, pero puedes dejarlo vacío)

6. Haz clic en **"Create Web Service"**

7. Espera a que se despliegue (puede tardar 5-10 minutos)

8. Copia la URL que te da Render (algo como: `https://plataforma-cursos-backend.onrender.com`)

## Paso 7: Configurar Supabase Storage (para imágenes)

1. En Supabase, ve a **"Storage"** en el menú lateral
2. Crea 3 buckets:
   - `profiles` (público)
   - `courses` (público)
   - `modulos` (público)

3. Para cada bucket, en **"Policies"**, agrega una política pública:
   - Policy name: `Public Access`
   - Allowed operation: `SELECT`
   - Policy definition: `true`

## Paso 8: Hostear el Frontend (Vercel - Gratis)

1. Ve a https://vercel.com y crea una cuenta (puedes usar GitHub)

2. Haz clic en **"Add New"** → **"Project"**

3. Importa tu repositorio de GitHub

4. Configura el proyecto:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. En **"Environment Variables"**, agrega:
   - `REACT_APP_API_URL`: (la URL de tu backend en Render, ejemplo: `https://plataforma-cursos-backend.onrender.com`)

6. Haz clic en **"Deploy"**

7. Espera a que se despliegue

8. Copia la URL que te da Vercel (algo como: `https://tu-proyecto.vercel.app`)

## Paso 9: Actualizar el Frontend para usar la API de producción

Necesitarás actualizar `client/src/App.js` o donde tengas configurado `axios` para usar la variable de entorno:

```javascript
// En client/src/App.js o donde configures axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## Paso 10: Verificar que todo funciona

1. Abre la URL de Vercel en tu navegador
2. Prueba crear un curso
3. Verifica que se guarde en Supabase

## Notas importantes:

- **Render** puede "dormir" el backend después de 15 minutos de inactividad (plan gratuito). La primera petición puede tardar ~30 segundos en despertar.
- **Vercel** tiene límites de ancho de banda en el plan gratuito, pero es suficiente para desarrollo.
- Las imágenes se suben al servidor de Render. Para producción, considera usar Supabase Storage.
- Mantén tu `.env` local y nunca lo subas a GitHub (ya está en `.gitignore`).

