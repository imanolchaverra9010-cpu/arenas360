"""
API Client for testing backend endpoints
Usage: python api_client.py
"""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000"


class ArenaClient:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.usuario = None
    
    def health_check(self) -> dict:
        """Check API health"""
        response = requests.get(f"{self.base_url}/health")
        return response.json()
    
    def login(self, email: str, password: str) -> bool:
        """Login to API"""
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={
                "email": email,
                "password": password
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            self.usuario = data["usuario"]
            return True
        else:
            print(f"❌ Login failed: {response.json()}")
            return False
    
    def register(self, **kwargs) -> dict:
        """Register new user"""
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json=kwargs
        )
        return response.json()
    
    def get_usuario(self, usuario_id: int) -> dict:
        """Get user by ID"""
        response = requests.get(f"{self.base_url}/api/usuarios/{usuario_id}")
        return response.json()
    
    def list_usuarios(self, tenant_id: Optional[int] = None) -> list:
        """List all users"""
        params = {}
        if tenant_id:
            params["tenant_id"] = tenant_id
        
        response = requests.get(
            f"{self.base_url}/api/usuarios/",
            params=params
        )
        return response.json()

    def list_eventos(self, estado: Optional[str] = None) -> list:
        """List all events"""
        params = {}
        if estado:
            params["estado"] = estado
        response = requests.get(
            f"{self.base_url}/api/eventos/",
            params=params
        )
        return response.json()

    def eventos_resumen(self) -> dict:
        """Get events summary counts"""
        response = requests.get(f"{self.base_url}/api/eventos/resumen")
        return response.json()

    def get_evento_cronograma(self, evento_id: int) -> dict:
        """Get event schedule for calendar screen"""
        response = requests.get(f"{self.base_url}/api/eventos/{evento_id}/cronograma")
        return response.json()

    def list_resultados(self, evento_id: int | None = None, filtro: str | None = None) -> dict:
        """List official results"""
        params = {}
        if evento_id:
            params["evento_id"] = evento_id
        if filtro:
            params["filtro"] = filtro
        response = requests.get(f"{self.base_url}/api/resultados/", params=params)
        return response.json()

    def get_resultado_detalle(self, result_id: str) -> dict:
        """Get result detail by composite id evento-prueba"""
        response = requests.get(f"{self.base_url}/api/resultados/detalle/{result_id}")
        return response.json()

    def list_atletas(self, q: str | None = None, filtro: str | None = None) -> dict:
        """List athletes with optional search and filter"""
        params = {}
        if q:
            params["q"] = q
        if filtro:
            params["filtro"] = filtro
        response = requests.get(f"{self.base_url}/api/atletas/", params=params)
        return response.json()

    def get_atleta(self, deportista_id: int) -> dict:
        """Get athlete profile"""
        response = requests.get(f"{self.base_url}/api/atletas/{deportista_id}")
        return response.json()

    def compare_atletas(self, atleta_a: int, atleta_b: int) -> dict:
        """Compare two athletes"""
        response = requests.get(
            f"{self.base_url}/api/atletas/comparar",
            params={"atleta_a": atleta_a, "atleta_b": atleta_b},
        )
        return response.json()

    def list_disciplinas(self, q: str | None = None, filtro: str | None = None) -> dict:
        """List sports and sub-disciplines"""
        params = {}
        if q:
            params["q"] = q
        if filtro:
            params["filtro"] = filtro
        response = requests.get(f"{self.base_url}/api/disciplinas/", params=params)
        return response.json()

    def get_disciplina(self, deporte_id: int) -> dict:
        """Get discipline detail with athletes, events and results"""
        response = requests.get(f"{self.base_url}/api/disciplinas/{deporte_id}")
        return response.json()


def main():
    """Test API endpoints"""
    print("=" * 50)
    print("🧪 API Client - Arenas 360")
    print("=" * 50)
    
    client = ArenaClient()
    
    # Health check
    print("\n📊 Health Check...")
    try:
        result = client.health_check()
        print(f"✅ {result}")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Login test
    print("\n🔐 Login Test...")
    if client.login("admin@arenas360.com", "Admin123!"):
        print(f"✅ Logged in as: {client.usuario['nombre_completo']}")
        print(f"   Token: {client.token[:20]}...")
        print(f"   Rol: {client.usuario['rol']}")
    else:
        print("❌ Login failed")
        return
    
    # List usuarios
    print("\n👥 Listing Users...")
    try:
        usuarios = client.list_usuarios()
        print(f"✅ Found {len(usuarios)} users:")
        for u in usuarios:
            print(f"   - {u['email']} ({u['nombre_completo']})")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Get specific user
    print("\n🔍 Get User by ID...")
    try:
        user = client.get_usuario(1)
        print(f"✅ User found:")
        print(json.dumps(user, indent=2, default=str))
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Test completed")
    print("=" * 50)


if __name__ == "__main__":
    main()
