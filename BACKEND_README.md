# Backend Arenas 360

Backend API en Python con FastAPI para la autenticación y gestión de usuarios en Arenas 360.

## Requisitos

- Python 3.9+
- PostgreSQL 12+

## Instalación

### 1. Crear entorno virtual

```bash
python -m venv venv

# En Windows:
venv\Scripts\activate

# En macOS/Linux:
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y actualiza con tus valores:

```bash
cp .env.example .env
```

Edita `.env`:
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/arenas360
SECRET_KEY=tu-clave-secreta-aqui
HOST=0.0.0.0
PORT=8000
```

### 4. Inicializar base de datos

Primero, importa el SQL dump:
```bash
psql -U usuario -d postgres -c "CREATE DATABASE arenas360"
psql -U usuario -d arenas360 < ./Cloud_SQL_Export_2026-05-22.sql
```

## Uso

### Iniciar servidor de desarrollo

```bash
python -m backend.main
```

O con reload automático:
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: http://localhost:8000

### Documentación interactiva

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Autenticación

#### POST `/api/auth/login`
Login de usuario
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

Respuesta:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "usuario": {
    "id": 1,
    "email": "usuario@example.com",
    "nombre_completo": "Juan Pérez García",
    "rol": "OPERADOR",
    "activo": true,
    ...
  }
}
```

#### POST `/api/auth/register`
Registrar nuevo usuario
```json
{
  "email": "nuevo@example.com",
  "password": "contraseña123",
  "tenant_id": 1,
  "primer_nombre": "Juan",
  "segundo_nombre": "Carlos",
  "primer_apellido": "Pérez",
  "segundo_apellido": "García",
  "telefono": "+573001234567"
}
```

### Usuarios

#### GET `/api/usuarios/`
Listar todos los usuarios (opcional filtrar por tenant)
```
/api/usuarios/?tenant_id=1
```

#### GET `/api/usuarios/{usuario_id}`
Obtener usuario por ID
```
/api/usuarios/1
```

## Estructura del proyecto

```
backend/
├── __init__.py
├── main.py          # Aplicación principal FastAPI
├── models.py        # Modelos SQLAlchemy
├── schemas.py       # Esquemas Pydantic
├── auth.py          # Utilidades de autenticación
├── database.py      # Configuración de base de datos
└── requirements.txt # Dependencias
```

## Integración con React Native

Desde tu app React Native, puedes hacer login así:

```javascript
const handleLogin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      // Guardar token y usuario
      await AsyncStorage.setItem('accessToken', data.access_token);
      await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
      // Navegar al home
      navigation.navigate('(tabs)');
    } else {
      Alert.alert('Error', data.detail);
    }
  } catch (error) {
    Alert.alert('Error', 'Conexión fallida');
  }
};
```

## Notas de seguridad

- ⚠️ **IMPORTANTE**: Cambia `SECRET_KEY` en producción
- Usa HTTPS en producción
- Implementa rate limiting
- Valida CORS según tus necesidades
- Implementa refresh tokens para sesiones largas

## Soporte

Para más información, consulta la documentación interactiva en `/docs`
