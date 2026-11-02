/**
 * Atlas Voyage - Module Carte Géographique Accessible
 * Intègre Leaflet (auto-hébergé) avec tuiles OpenStreetMap, attribution conforme, et alternative textuelle
 */
export function initOfferMap(containerId, { lat, lng, title, address, zoom = 14 }) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (typeof L === 'undefined') {
    container.innerHTML = `
      <div class="av-map-fallback">
        <p><strong>Localisation :</strong> ${address || title}</p>
        <p>Coordonnées : ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
        <p><a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}" target="_blank" rel="noopener" class="av-btn av-btn--outline av-btn--sm">
          Ouvrir dans OpenStreetMap
        </a></p>
      </div>
    `;
    return null;
  }

  try {
    const map = L.map(containerId, {
      scrollWheelZoom: false, // Évite de bloquer le défilement de page
      attributionControl: true
    }).setView([lat, lng], zoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributeurs'
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    const popupContent = `
      <div style="font-family: inherit; font-size: 14px; line-height: 1.4;">
        <strong style="color: #0A2B66;">${title}</strong><br>
        <span style="color: #4B5563;">${address || ''}</span>
      </div>
    `;
    marker.bindPopup(popupContent).openPopup();

    return map;
  } catch (err) {
    console.warn('Erreur initialisation Leaflet :', err);
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.initOfferMap = initOfferMap;
}

