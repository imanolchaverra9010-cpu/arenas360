# 🚀 Backend Arenas 360 - Guía Rápida

## ¿Qué se ha creado?

Se ha implementado un **Backend API completo en Python con FastAPI** para manejar la autenticación y gestión de usuarios de la app Arenas 360, conectado directamente a tu base de datos PostgreSQL.

### Estructura de archivos creados:

```
backend/
├── __init__.py              # Paquete Python
├── main.py                  # 🔴 Aplicación principal FastAPI
├── models.py                # Modelos SQLAlchemy (Usuario)
├── schemas.py               # Esquemas Pydantic (validación)
├── auth.py                  # Funciones de autenticación (JWT, hash)
├── database.py              # Conexión a PostgreSQL
├── config.py                # Configuración de ambiente
└── utils.py                 # Utilidades para testing

Archivos de configuración:
├── .env.example             # Variables de entorno (ejemplo)
├── requirements.txt         # Dependencias Python
├── setup_backend.py         # Script de inicialización
├── api_client.py            # Cliente para testing
├── BACKEND_README.md        # Documentación completa
└── BACKEND_WINDOWS_SETUP.md # Guía para Windows
```

## Endpoints disponibles

### 🔐 Autenticación

**POST `/api/auth/login`**
- Valida email y contraseña
- Retorna JWT token + información del usuario

**POST `/api/auth/register`**
- Crea nuevo usuario
- Hash de contraseña automático

### 👥 Usuarios

**GET `/api/usuarios/`**
- Lista todos los usuarios
- Filtra por tenant_id (opcional)

**GET `/api/usuarios/{id}`**
- Obtiene usuario por ID

### 📊 Sistema

**GET `/health`**
- Verifica que el API esté activo

## 🔧 Instalación rápida

### 1. En terminal PowerShell:

```powershell
cd C:\Users\Victus\arenas360

# Crear entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo .env
Copy-Item .env.example .env

# Editar .env con tus credenciales de base de datos
notepad .env
```

### 2. Configurar base de datos

Actualiza en `.env`:
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/arenas360
SECRET_KEY=tu-clave-secreta-aqui-cambiar-en-produccion
```

### 3. Inicializar:

```powershell
python setup_backend.py
```

Esto creará:
- Tablas en la BD
- 3 usuarios de prueba:
  - admin@arenas360.com / Admin123!
  - operador@arenas360.com / Operador123!
  - juez@arenas360.com / Juez123!

### 4. Ejecutar:

```powershell
python -m backend.main
```

El API estará en: http://localhost:8000

## 📱 Integración con React Native

Desde tu app, puedes hacer login así:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const handleLogin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      // Guardar token
      await AsyncStorage.setItem('accessToken', data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.usuario));
      
      // Navegar al home
      navigation.navigate('(tabs)');
    } else {
      Alert.alert('Error', data.detail);
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo conectar al servidor');
  }
};
```

## 📚 Documentación interactiva

Abre en tu navegador:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Probar endpoints

### Opción 1: Swagger UI (recomendado)
Abre http://localhost:8000/docs - interfaz visual para probar

### Opción 2: PowerShell
```powershell
$body = @{
    email = "admin@arenas360.com"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### Opción 3: Cliente Python
```powershell
python api_client.py
```

## 🔑 Características

✅ **Autenticación segura**
- Contraseñas hasheadas con bcrypt
- JWT tokens
- Validación de email

✅ **Base de datos**
- Conecta a tu PostgreSQL existente
- Modelos SQLAlchemy para Usuario
- Soporte para multi-tenant

✅ **Validación**
- Schemas Pydantic automáticos
- Validación de tipos
- Documentación automática

✅ **Documentación**
- Swagger UI interactivo
- ReDoc API documentation
- Guías de instalación

## ⚠️ Seguridad

Antes de producción:

1. ✅ Cambia `SECRET_KEY` en `.env`
2. ✅ Usa HTTPS (no HTTP)
3. ✅ Implementa rate limiting
4. ✅ Valida CORS en producción
5. ✅ Usa variables de entorno para credenciales

## 🐛 Solución de problemas

**Error: "Connection refused"**
- ¿PostgreSQL está corriendo?
- ¿Credenciales en .env son correctas?

**Error: "Module not found"**
```powershell
pip install -r requirements.txt --upgrade
```

**Puerto 8000 en uso:**
```powershell
python -m backend.main --port 8001
```

## 📞 Próximos pasos

1. **Implementar refresh tokens** - para sesiones largas
2. **Rate limiting** - proteger contra ataques
3. **Email verification** - validar emails reales
4. **Password reset** - recuperación de contraseña
5. **2FA** - autenticación de dos factores
6. **Logging** - auditoría de accesos

## 📖 Archivos de documentación

- `BACKEND_README.md` - Documentación completa
- `BACKEND_WINDOWS_SETUP.md` - Guía para Windows
- `api_client.py` - Ejemplos de uso

---

**¡Tu backend está listo! 🎉**

Para ejecutar: `python -m backend.main`

Para más detalles: Lee `BACKEND_README.md`
