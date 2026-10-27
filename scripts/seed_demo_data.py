"""
Données de démonstration Atlas Voyage : villes, utilisateurs, offres (5 types) et bundles.

Passe par l'API REST (le backend doit tourner sur :8080), donc toutes les règles métier
s'appliquent (mots de passe hachés, propriétaire = utilisateur connecté, validations).
Le script peut être relancé : ce qui existe déjà (même email, nom ou titre) est ignoré.

    python scripts/seed_demo_data.py
    python scripts/seed_demo_data.py --api http://localhost:8080 --images http://localhost:5500/images

Mot de passe de tous les comptes créés : password123
"""
import argparse
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


admin = login("omar.tazi@atlasvoyage.ma")

# ------------------------------------------------------------------ villes
CITIES = [
    ("Casablanca", 33.5731, -7.5898),
    ("Agadir", 30.4278, -9.5981),
    ("Ouarzazate", 30.9335, -6.9370),
]
cities = {c["name"]: c["id"] for c in call("GET", "/api/cities")}
for name, lat, lng in CITIES:
    if name not in cities:
        cities[name] = call("POST", "/api/cities", {"name": name, "latitude": lat, "longitude": lng}, admin)["id"]
        print("ville     ", name)

# ------------------------------------------------------------------ utilisateurs
USERS = [
    ("Youssef Alami", "youssef.alami@atlasvoyage.ma", "SUPPLIER"),
    ("Salma Bennis", "salma.bennis@atlasvoyage.ma", "SUPPLIER"),
    ("Hamza Cherkaoui", "hamza.cherkaoui@atlasvoyage.ma", "AGENT"),
    ("Amine Berrada", "amine.berrada@example.com", "CLIENT"),
    ("Lina Tazi", "lina.tazi@example.com", "CLIENT"),
]
existing_emails = {u["email"].lower() for u in call("GET", "/api/users", token=admin)}
for full_name, email, role in USERS:
    if email not in existing_emails:
        call("POST", "/api/users", {"fullName": full_name, "email": email, "role": role, "password": PASSWORD}, admin)
        print("utilisateur", email)
# un compte archivé pour montrer le filtre « archivés »
if "ancien.client@example.com" not in existing_emails:
    old = call("POST", "/api/users", {"fullName": "Ancien Client", "email": "ancien.client@example.com",
                                      "role": "CLIENT", "password": PASSWORD}, admin)
    call("POST", f"/api/users/{old['id']}/archive", token=admin)
    print("utilisateur ancien.client@example.com (archivé)")

# ------------------------------------------------------------------ offres
IMG = {
    "Marrakech": f"{args.images}/marrakech.jpg",
    "Chefchaouen": f"{args.images}/chefchaouen.jpg",
    "Fès": f"{args.images}/fes.jpg",
    "Essaouira": f"{args.images}/essaouira.jpg",
}


# Photos propres à chaque offre (frontend/images/offers/), pour ne pas afficher une photo de ville sur une voiture ou un vol.
OFFER_IMG = {
    "Kasbah Ouarzazate": "kasbah-ouarzazate",
    "Dacia Logan": "dacia-logan",
    "Renault Clio": "renault-clio",
    "Toyota Yaris": "toyota-yaris",
    "Casablanca - Marrakech": "vol-casablanca-marrakech",
    "Paris - Casablanca": "vol-paris-casablanca",
    "Casablanca - Agadir": "vol-casablanca-agadir",
    "Aéroport Casablanca - Centre-ville": "taxi-casablanca",
    "Aéroport Marrakech - Médina": "taxi-marrakech-mercedes",
    "Aéroport Tanger - Centre-ville": "taxi-tanger-bleu",
}


def offer(type_, title, city, price, stock, pay_on_arrival=False, active=True, **fields):
    body = {"type": type_, "title": title, "cityId": cities[city], "basePrice": price, "stock": stock,
            "allowsPayOnArrival": pay_on_arrival, "active": active, **fields}
    if title in OFFER_IMG:
        body["images"] = [f"{args.images}/offers/{OFFER_IMG[title]}.jpg"]
    elif type_ in ("HOTEL", "EXCURSION") and city in IMG:
        body["images"] = [IMG[city]]
    return body


def hotel(title, city, price, stock, stars, room, **kw):
    return offer("HOTEL", title, city, price, stock, stars=stars, roomType=room, **kw)


def flight(title, price, stock, airline, number, dep, arr, dep_at, arr_at, **kw):
    return offer("FLIGHT", title, kw.pop("city"), price, stock, airline=airline, flightNumber=number,
                 departureAirport=dep, arrivalAirport=arr, departureDateTime=dep_at, arrivalDateTime=arr_at, **kw)


def car(title, city, price, stock, brand, model, transmission, seats, **kw):
    return offer("CAR", title, city, price, stock, brand=brand, model=model, transmission=transmission, seats=seats, **kw)


def taxi(title, city, price, stock, pickup, dropoff, vehicle, **kw):
    return offer("TAXI_TRANSFER", title, city, price, stock, pickupLocation=pickup, dropoffLocation=dropoff,
                 vehicleType=vehicle, **kw)


def excursion(title, city, price, stock, hours, itinerary, **kw):
    return offer("EXCURSION", title, city, price, stock, durationHours=hours, includesGuide=True,
                 includesTransport=True, itinerary=itinerary, **kw)


OFFERS = {
    # Karim : hôtels
    "karim.idrissi@atlasvoyage.ma": [
        hotel("Riad Yasmine", "Marrakech", 950, 6, 4, "Suite", pay_on_arrival=True,
              description="Riad de charme au coeur de la médina, avec patio et piscine."),
        hotel("Dar Chefchaouen", "Chefchaouen", 780, 8, 3, "Chambre double", pay_on_arrival=True,
              description="Maison traditionnelle aux murs bleus, terrasse avec vue sur les montagnes."),
        hotel("Riad Essaouira Vue Mer", "Essaouira", 1100, 2, 5, "Suite",
              description="Suites face à l'océan, petit-déjeuner inclus. Stock bas."),
        hotel("Hôtel Atlas Fès", "Fès", 620, 10, 3, "Chambre double", pay_on_arrival=True,
              description="Hôtel confortable à dix minutes de la médina de Fès."),
        hotel("Kasbah Ouarzazate", "Ouarzazate", 540, 5, 3, "Chambre double", active=False,
              description="Offre désactivée (exemple de statut inactif)."),
    ],
    # Youssef : vols et voitures
    "youssef.alami@atlasvoyage.ma": [
        flight("Casablanca - Marrakech", 450, 40, "Royal Air Maroc", "AT401", "CMN", "RAK",
               "2026-12-05T09:00:00", "2026-12-05T09:55:00", city="Marrakech"),
        flight("Paris - Casablanca", 1200, 25, "Royal Air Maroc", "AT789", "ORY", "CMN",
               "2026-12-10T07:30:00", "2026-12-10T09:45:00", city="Casablanca"),
        flight("Casablanca - Agadir", 380, 30, "Air Arabia", "3O302", "CMN", "AGA",
               "2026-12-12T14:00:00", "2026-12-12T14:50:00", city="Agadir"),
        car("Dacia Logan", "Marrakech", 300, 5, "Dacia", "Logan", "Manuelle", 5, pay_on_arrival=True,
            description="Prix par jour, kilométrage illimité."),
        car("Renault Clio", "Casablanca", 350, 4, "Renault", "Clio", "Manuelle", 5, pay_on_arrival=True),
        car("Toyota Yaris", "Agadir", 380, 0, "Toyota", "Yaris", "Automatique", 5,
            description="Plus de stock (exemple d'offre épuisée)."),
    ],
    # Salma : taxis et excursions
    "salma.bennis@atlasvoyage.ma": [
        taxi("Aéroport Marrakech - Médina", "Marrakech", 150, 20, "Aéroport Marrakech-Ménara",
             "Médina de Marrakech", "Berline", pay_on_arrival=True),
        taxi("Aéroport Casablanca - Centre-ville", "Casablanca", 250, 15, "Aéroport Mohammed V",
             "Centre-ville de Casablanca", "Berline", pay_on_arrival=True),
        taxi("Aéroport Tanger - Centre-ville", "Tanger", 120, 12, "Aéroport Ibn Battouta",
             "Centre-ville de Tanger", "Monospace", pay_on_arrival=True),
        excursion("Chefchaouen - Tanger", "Chefchaouen", 600, 12, 10,
                  "Départ de Chefchaouen, route côtière, visite de Tanger, retour en fin de journée."),
        excursion("Désert d'Agafay", "Marrakech", 450, 14, 6,
                  "Balade en quad et en dromadaire, thé au coucher du soleil."),
        excursion("Médina d'Essaouira", "Essaouira", 300, 10, 4,
                  "Visite guidée des remparts, du port et des ateliers d'artisans."),
        excursion("Médina de Fès", "Fès", 250, 16, 5,
                  "Visite guidée des tanneries, des médersas et des souks."),
    ],
}

all_offers = {o["title"]: o for o in call("GET", "/api/offers")}
for email, offers in OFFERS.items():
    token = login(email)
    for body in offers:
        if body["title"] not in all_offers:
            all_offers[body["title"]] = call("POST", "/api/offers", body, token)
            print("offre     ", body["type"].ljust(13), body["title"])

# ------------------------------------------------------------------ bundles
BUNDLES = {
    "nadia.elfassi@atlasvoyage.ma": [
        ("Escapade Marrakech", 15, ["Riad Yasmine", "Désert d'Agafay", "Aéroport Marrakech - Médina"],
         "Un riad, une excursion dans le désert et le transfert depuis l'aéroport."),
        ("Week-end Chefchaouen", 10, ["Dar Chefchaouen", "Chefchaouen - Tanger"],
         "Deux jours dans la ville bleue avec une journée à Tanger."),
        ("Séjour Essaouira", 5, ["Riad Essaouira Vue Mer", "Médina d'Essaouira"],
         "Suite face à la mer et visite guidée de la médina."),
    ],
    "hamza.cherkaoui@atlasvoyage.ma": [
        ("Cap sur Fès", 10, ["Hôtel Atlas Fès", "Médina de Fès"], "Hôtel à Fès et visite guidée de la médina."),
    ],
}
known_bundles = {b["title"] for b in call("GET", "/api/bundles")}
for email, bundles in BUNDLES.items():
    token = login(email)
    for title, discount, offer_titles, description in bundles:
        if title not in known_bundles:
            call("POST", "/api/bundles", {"title": title, "description": description, "discountPercentage": discount,
                                           "offerIds": [all_offers[t]["id"] for t in offer_titles]}, token)
            print("bundle    ", title)

print("Terminé. Comptes : mot de passe", PASSWORD)
