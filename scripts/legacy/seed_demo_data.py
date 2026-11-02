"""
OBSOLÈTE — NE PLUS UTILISER.
Les données de démonstration sont désormais gérées de manière unique, idempotente
et transactionnelle par com.agence.voyage.config.DataSeeder (Backend Spring Boot).
Conserver uniquement pour référence historique.
"""
import argparse
import datetime
import json
import sys
import urllib.error
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument("--api", default="http://localhost:8080")
parser.add_argument("--images", default="http://localhost:5500/images")
args = parser.parse_args()

PASSWORD = "password123"

def call(method, path, body=None, token=None):
    request = urllib.request.Request(
        args.api + path,
        method=method,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})},
    )
    try:
        with urllib.request.urlopen(request) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        sys.exit(f"{method} {path} -> {error.code} {detail}")
    except urllib.error.URLError:
        sys.exit(f"Backend injoignable sur {args.api} : démarrez-le d'abord.")

def login(email):
    return call("POST", "/api/auth/login", {"email": email, "password": PASSWORD})["token"]

