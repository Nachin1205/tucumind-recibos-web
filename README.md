# tucumind-recibos-web

Aplicacion para gestionar clientes y recibos digitales.

## Estructura

- `apps/web`: frontend React + Vite
- `apps/api`: backend FastAPI + SQLAlchemy

## Base de datos externa

El backend ya puede funcionar sin el contenedor de Postgres. Para deploy en un servidor chico, la recomendacion es usar una base externa/administrada y configurar:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=0
DB_POOL_RECYCLE=300
```

Notas:

- Si `DATABASE_URL` esta definida, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` quedan como fallback.
- El pool esta configurado chico por defecto para reducir consumo en servidores free.
- `docker-compose.yml` puede seguir usandose para desarrollo local, pero ya no es necesario para produccion.
