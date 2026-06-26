# VESTRY — Guía de inicio rápido

## Pre-requisitos
- Node.js 18+
- PostgreSQL 14+ corriendo localmente

## 1. Configurar base de datos

Crea la base de datos en PostgreSQL:
```sql
CREATE DATABASE vestry;
```

## 2. Configurar variables de entorno

Edita el archivo `.env`:
```
DATABASE_URL=postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/vestry
ANTHROPIC_API_KEY=sk-ant-TU_API_KEY_AQUI
PORT=3000
JWT_SECRET=cambia_este_secreto
```

## 3. Iniciar el servidor

```bash
npm start
```

O en modo desarrollo (con auto-reload):
```bash
npm run dev
```

## 4. Abrir la app

Visita: http://localhost:3000

## Obtener tu API Key de Anthropic

1. Ve a https://console.anthropic.com
2. Crea una cuenta o inicia sesión
3. En "API Keys", genera una nueva key
4. Pégala en el `.env` como `ANTHROPIC_API_KEY`

## Notas
- La remoción de fondo funciona 100% en el navegador sin API externa
- Las imágenes se guardan en `server/uploads/`
- La base de datos se inicializa automáticamente al arrancar el servidor
