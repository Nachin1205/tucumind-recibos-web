# tucumind-recibos-web

Aplicacion para gestionar clientes y recibos digitales.

## Estructura

- `apps/web`: frontend React + Vite
- `apps/api`: backend FastAPI + SQLAlchemy

## Desarrollo local sin Docker

1. Instalar PostgreSQL localmente.
2. Crear la base:

```sql
CREATE DATABASE tucumind_recibos;
```

3. Configurar la conexion en `.env` o `apps/api/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:TU_PASSWORD@localhost:5432/tucumind_recibos
```

4. Aplicar migraciones:

```bash
cd apps/api
alembic upgrade head
```

5. Levantar backend:

```bash
cd apps/api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

6. Levantar frontend:

```bash
cd apps/web
npm run dev
```

## Produccion

Para deploy en un servidor chico, la recomendacion es usar una base externa/administrada y configurar:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=0
DB_POOL_RECYCLE=300
```

Notas:

- Si `DATABASE_URL` esta definida, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` quedan como fallback.
- El pool esta configurado chico por defecto para reducir consumo en servidores free.
