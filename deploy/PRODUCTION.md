# Deploy productivo

Supuestos:

- repo en `/srv/tucumind-recibos-web`
- dominio `https://recibos.tucumind.com`
- Nginx en Ubuntu
- Postgres externo

## 1. Backend

```bash
cd /srv/tucumind-recibos-web/apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.production.example .env.production
```

Editar `apps/api/.env.production` con valores reales.

Aplicar migraciones:

```bash
cd /srv/tucumind-recibos-web/apps/api
source .venv/bin/activate
alembic upgrade head
```

Instalar y habilitar el servicio:

```bash
sudo cp /srv/tucumind-recibos-web/deploy/systemd/tucumind-api.service /etc/systemd/system/tucumind-api.service
sudo systemctl daemon-reload
sudo systemctl enable tucumind-api
sudo systemctl start tucumind-api
sudo systemctl status tucumind-api
```

## 2. Frontend

```bash
cd /srv/tucumind-recibos-web/apps/web
npm ci
npm run build
```

Vite usa `apps/web/.env.production`, que ya deja la API en `/api/v1`.

## 3. Nginx

```bash
sudo cp /srv/tucumind-recibos-web/deploy/nginx/recibos.tucumind.com.conf /etc/nginx/sites-available/recibos.tucumind.com
sudo ln -s /etc/nginx/sites-available/recibos.tucumind.com /etc/nginx/sites-enabled/recibos.tucumind.com
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Certificados

Ejemplo con Certbot:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d recibos.tucumind.com
```

## 5. Actualizar produccion

```bash
cd /srv/tucumind-recibos-web
git pull

cd apps/api
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart tucumind-api

cd ../web
npm ci
npm run build
sudo systemctl reload nginx
```
