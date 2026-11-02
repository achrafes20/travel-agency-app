(function exposeCatalogConfig(global) {
  "use strict";

  const OFFER_LABELS = Object.freeze({
    FLIGHT: "Vols",
    HOTEL: "Hôtels & Riads",
    CAR: "Location de voiture",
    TAXI_TRANSFER: "Taxi/Transferts",
    EXCURSION: "Excursions",
  });

  const NAV = Object.freeze([
    Object.freeze([OFFER_LABELS.HOTEL, "bed"]),
    Object.freeze([OFFER_LABELS.FLIGHT, "plane"]),
    Object.freeze([OFFER_LABELS.CAR, "car"]),
    Object.freeze([OFFER_LABELS.TAXI_TRANSFER, "taxi"]),
    Object.freeze([OFFER_LABELS.EXCURSION, "compass"]),
  ]);

  global.AtlasCatalog = Object.freeze({ OFFER_LABELS, NAV });
})(window);
