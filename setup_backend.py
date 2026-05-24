#!/usr/bin/env python3
"""
Setup script for initializing the backend
Run: python setup_backend.py
"""

import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database import SessionLocal, engine
from backend.models import Base, Usuario, RolUsuario
from backend.auth import hash_password
from sqlalchemy import select


def init_db():
    """Initialize database tables"""
    print("📊 Inicializando tablas de base de datos...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    return True


def create_default_users():
    """Create default test users"""
    print("\n👥 Creando usuarios de prueba...")
    
    db = SessionLocal()
    try:
        test_users = [
            {
                "email": "admin@arenas360.com",
                "password": "Admin123!",
                "primer_nombre": "Admin",
                "primer_apellido": "Arenas",
                "rol": RolUsuario.SUPERADMIN,
                "tenant_id": 1
            },
            {
                "email": "operador@arenas360.com",
                "password": "Operador123!",
                "primer_nombre": "Operador",
                "primer_apellido": "Sistema",
                "rol": RolUsuario.OPERADOR,
                "tenant_id": 1
            },
            {
                "email": "juez@arenas360.com",
                "password": "Juez123!",
                "primer_nombre": "Juan",
                "primer_apellido": "Juez",
                "rol": RolUsuario.JUEZ,
                "tenant_id": 1
            },
        ]
        
        for user_data in test_users:
            # Check if user already exists
            stmt = select(Usuario).where(Usuario.email == user_data["email"])
            existing = db.execute(stmt).scalars().first()
            
            if not existing:
                user = Usuario(
                    email=user_data["email"],
                    hashed_password=hash_password(user_data["password"]),
                    primer_nombre=user_data["primer_nombre"],
                    primer_apellido=user_data["primer_apellido"],
                    rol=user_data["rol"],
                    tenant_id=user_data["tenant_id"],
                    activo=True
                )
                db.add(user)
                print(f"  ✅ {user_data['email']} creado")
            else:
                print(f"  ℹ️  {user_data['email']} ya existe")
        
        db.commit()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True


def check_env():
    """Check if .env file exists"""
    print("\n⚙️  Verificando archivo .env...")
    
    if not os.path.exists(".env"):
        print("❌ Archivo .env no encontrado")
        print("   Creando desde .env.example...")
        
        if os.path.exists(".env.example"):
            with open(".env.example", "r") as f:
                content = f.read()
            with open(".env", "w") as f:
                f.write(content)
            print("✅ Archivo .env creado. Actualiza los valores según sea necesario")
        else:
            print("❌ .env.example tampoco encontrado")
            return False
    else:
        print("✅ Archivo .env existe")
    
    return True


def main():
    """Main setup function"""
    print("=" * 50)
    print("🚀 Setup del Backend - Arenas 360")
    print("=" * 50)
    
    # Check environment
    if not check_env():
        print("\n❌ Setup incompleto")
        return False
    
    # Initialize database
    if not init_db():
        print("\n❌ Setup incompleto")
        return False
    
    # Create default users
    if not create_default_users():
        print("\n❌ Setup incompleto")
        return False
    
    print("\n" + "=" * 50)
    print("✅ Setup completado exitosamente!")
    print("=" * 50)
    print("\nUsuarios de prueba creados:")
    print("  admin@arenas360.com (Admin123!)")
    print("  operador@arenas360.com (Operador123!)")
    print("  juez@arenas360.com (Juez123!)")
    print("\nPróximo paso: python -m backend.main")
    print("=" * 50)
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
