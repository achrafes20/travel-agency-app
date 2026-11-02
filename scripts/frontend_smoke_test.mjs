import assert from "node:assert/strict";

const frontendBase = process.env.FRONTEND_BASE || "http://127.0.0.1:5500/frontend";
const apiBase = process.env.API_BASE || "http://localhost:8080";

const pages = [
  "accueil.html",
  "catalogue.html?type=H%C3%B4tels%20%26%20Riads",
  "catalogue.html?type=Vols",
  "catalogue.html?type=Location%20de%20voiture",
  "catalogue.html?type=Taxi%2FTransferts",
  "catalogue.html?type=Excursions",
  "offre.html?id=1",
  "panier.html",
];

for (const page of pages) {
  const response = await fetch(`${frontendBase}/${page}`);
  assert.equal(response.status, 200, `${page} doit répondre HTTP 200`);
  const html = await response.text();
  assert.match(html, /<div id="app"><\/div>/, `${page} doit contenir la racine applicative`);
  assert.match(html, /js\/core\/catalog-config\.js/, `${page} doit charger la configuration partagée du catalogue`);
}

let offerCount = "API ignorée";
const privatePages = ["client/index.html?page=checkout", "client/index.html?page=confirmation&id=1", "client/index.html?page=reservations",
  "supplier/index.html?page=bookings", "agent/index.html?page=bookings", "admin/index.html?page=bookings",
  "client/index.html?page=payment&id=1", "agent/index.html?page=payments", "admin/index.html?page=payments",
  ...["admin","supplier","agent","client"].flatMap(area=>[area+"/index.html?page=notifications",area+"/index.html?page=dashboard",area+"/index.html?page="+(area==="client"?"profil":"profile")])];
for (const page of privatePages) {
  const response = await fetch(`${frontendBase}/${page}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /js\/core\/bookings\.js/, page + " : module Booking partagé");
  assert.match(html, /js\/core\/api\.js/, page + " : API authentifiée");
  assert.match(html, /js\/core\/payments\.js/, page + " : module Paiements partagé");
  assert.match(html, /js\/core\/notifications\.js/, page + " : module Notifications partagé");
  assert.match(html, /js\/core\/stats\.js\?v=50/, page + " : module Statistiques partagé");
  assert.match(html, /chart\.js@4\.4\.8\/dist\/chart\.umd\.min\.js/, page + " : Chart.js épinglé");
  assert.match(html,/js\/core\/account\.js\?v=60/,page+" : profils réels");
  assert.match(html,/js\/core\/uploader\.js\?v=61/,page+" : uploader réel");
}
const accountPages=["mot-de-passe-oublie.html","reinitialiser-mot-de-passe.html","verification-email.html"];
for(const page of accountPages){const response=await fetch(`${frontendBase}/${page}`);assert.equal(response.status,200);const html=await response.text();assert.match(html,/id="account-auth-root"/);assert.match(html,/account-auth\.page\.js\?v=60/);assert.match(html,/no-referrer/);}
for(const module of ["js/core/account.js","js/core/uploader.js","css/account.css"])assert.equal((await fetch(`${frontendBase}/${module}`)).status,200);
assert.equal((await fetch(`${frontendBase}/js/core/bookings.js`)).status, 200);
assert.equal((await fetch(`${frontendBase}/js/core/payments.js`)).status, 200);
assert.equal((await fetch(`${frontendBase}/js/core/notifications.js`)).status, 200);
assert.equal((await fetch(`${frontendBase}/js/core/stats.js`)).status, 200);
assert.equal((await fetch(`${frontendBase}/css/stats.css`)).status, 200);
if (process.env.SKIP_API !== "1") {
  const offersResponse = await fetch(`${apiBase}/api/offers/search?page=0&size=100`);
  assert.equal(offersResponse.status, 200, "Le catalogue API doit répondre HTTP 200");
  const offers = (await offersResponse.json()).content || [];
  if (process.env.ALLOW_EMPTY_CATALOG !== "1") {
    assert.ok(offers.length > 0, "Le catalogue API doit contenir des offres");
    const types = new Set(offers.map((offer) => offer.type));
    for (const type of ["HOTEL", "FLIGHT", "CAR", "TAXI_TRANSFER", "EXCURSION"]) {
      assert.ok(types.has(type), `Le catalogue doit contenir le type ${type}`);
    }
  }
  offerCount = offers.length ? `${offers.length} offres, 5 catégories` : "catalogue API vide autorisé";
}

console.log(`Smoke frontend réussi : ${pages.length + privatePages.length+accountPages.length} pages, ${offerCount}.`);
