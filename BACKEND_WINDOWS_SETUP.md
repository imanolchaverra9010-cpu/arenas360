# Guía de ejecución del Backend en Windows

## Paso 1: Configurar la base de datos PostgreSQL

### Opción A: PostgreSQL instalado localmente
```powershell
# Inicia el servicio PostgreSQL
Start-Service postgresql-x64-17

# Crea la base de datos
$env:PGPASSWORD = "tu_password"
psql -U postgres -c "CREATE DATABASE arenas360;"
psql -U postgres -d arenas360 -f "Cloud_SQL_Export_2026-05-22 (12_08_27).sql"
```

### Opción B: Usar CloudSQL (recomendado)
Si usas Cloud SQL, actualiza el `DATABASE_URL` en `.env`:
```
DATABASE_URL=postgresql://usuario:password@ip-o-host-cloudsql:5432/arenas360
```

## Paso 2: Preparar entorno Python

```powershell
# Navegar a la carpeta del proyecto
cd C:\Users\Victus\arenas360

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Si recibes error de permisos:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Paso 3: Instalar dependencias

```powershell
pip install -r requirements.txt
```

## Paso 4: Configurar variables de entorno

```powershell
# Copiar archivo de ejemplo
Copy-Item .env.example .env

# Editar .env con tu editor (Notepad, VSCode, etc)
# Actualizar DATABASE_URL y SECRET_KEY
```

## Paso 5: Ejecutar el servidor

```powershell
# Opción A: Ejecución simple
python -m backend.main

# Opción B: Con reload automático (desarrollo)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Paso 6: Probar el API

Abre en tu navegador:
```
http://localhost:8000/docs
```

O desde PowerShell:
```powershell
# Test de login (reemplaza con un usuario válido)
$body = @{
    email = "usuario@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

## Solución de problemas

### Error: "Cannot locate psycopg2"
```powershell
pip install psycopg2-binary --upgrade
```

### Error: "Connection refused" (Base de datos)
Verifica que:
1. PostgreSQL está ejecutándose (Start-Service postgresql-x64-17)
2. Las credenciales en `.env` son correctas
3. La base de datos existe

### Error: Puerto 8000 ya en uso
```powershell
# Usa otro puerto
uvicorn backend.main:app --reload --port 8001
```

### Ver procesos en puerto 8000
```powershell
netstat -ano | findstr :8000
# Matar proceso (reemplaza PID)
taskkill /PID 12345 /F
```

## Parar el servidor

```powershell
# Ctrl + C en la terminal donde corre el servidor
# O desde otra terminal PowerShell:
taskkill /IM python.exe /F
```

## Deactivar entorno virtual

```powershell
deactivate
```

## Próximos pasos

1. Crear usuarios de prueba en la base de datos
2. Integrar el endpoint de login en la app React Native
3. Implementar refresh tokens
4. Agregar validaciones adicionales según sea necesario
