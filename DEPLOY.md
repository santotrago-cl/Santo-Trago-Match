# Santo Match — Guía de deploy (GitHub + Vercel)

El proyecto está listo para desplegar. Solo necesita las variables de entorno.
Todo esto se hace en **tus** cuentas (GitHub, Vercel, Supabase, OpenAI).

## 0. Requisito previo (Supabase) — ya hecho
La tabla `products` ya está creada y sembrada (21 SKU) en tu proyecto Supabase.
Si alguna vez necesitas recrearla, corre `santo-match-supabase.sql` en el SQL Editor.

## 1. Subir el código a GitHub
Crea un repositorio **vacío** en github.com/new (sin README ni .gitignore).
Luego, dentro de la carpeta `santo-match`:

```bash
git init
git add -A
git commit -m "Santo Match"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/santo-match.git
git push -u origin main
```

## 2. Importar en Vercel
1. En vercel.com → **Add New… → Project** → importa el repo `santo-match`.
2. Framework: **Next.js** (se detecta solo). No cambies build/output.
3. Antes de **Deploy**, agrega las variables de entorno (paso 3).

## 3. Variables de entorno (Vercel → Project → Settings → Environment Variables)
Configúralas para **Production** (y Preview si quieres):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://trjjpkoymksszpyqnoly.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon/publishable key (`sb_publishable_...`) |
| `OPENAI_API_KEY` | tu API key de OpenAI (**secreta**, solo server) |
| `OPENAI_MODEL` | `gpt-4o-mini` (opcional) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `56950056209` |

Nunca uses la **service_role** de Supabase aquí. Ninguna clave va en el código ni en el repo.

## 4. Deploy
Presiona **Deploy**. Cada `git push` a `main` redepliega automáticamente.

## 5. Validación post-deploy (desde el teléfono, sobre la URL pública)
1. Escribe: *"Somos 5 amigos, tenemos $30.000, queremos algo tropical y no demasiado dulce."*
2. Debe recomendar una combinación real dentro de presupuesto, con explicación.
3. Prueba los ajustes (Más dulce / Más refrescante / Más económico / Otra opción).
4. "Pedir por WhatsApp" debe abrir WhatsApp con el mensaje al número de Santo Trago.
5. En producción **no** deben aparecer `intentSource`/`catalogSource` ni banners técnicos
   (solo existen en desarrollo).

## Notas
- Si OpenAI falla o falta la key, la app sigue funcionando con el intérprete de respaldo
  (no se cae). Con la key configurada, usa el LLM real.
- Si Supabase no responde, la app usa el catálogo local de respaldo automáticamente.
