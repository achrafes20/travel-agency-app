/**
 * Page détail d'une ville.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const cityId = params.get("id");

  if (!cityId) {
    AdminLayout.mount(
      "villes",
      "Ville introuvable",
      "Identifiant manquant dans l'URL.",
      `<div class="alert">Paramètre <code>id</code> requis. <a href="villes.html">Retour à la liste</a></div>`,
    );
    return;
  }

  AdminLayout.mount(
    "villes",
    "Détail de la ville",
    "Consultation des informations enregistrées dans le référentiel.",
    `
      <div id="detail-content" class="villes-panel">
        <p>Chargement…</p>
      </div>
    `,
  );

  const container = document.getElementById("detail-content");

  try {
    const city = await CityService.getById(cityId);
    container.innerHTML = `
      <div class="breadcrumb">
        <a href="villes.html">Villes</a> / ${dom.escapeHtml(city.name)}
      </div>
      <div class="detail-card">
        <div class="detail-card-head">
          <h2>${dom.escapeHtml(city.name)}</h2>
          <span class="badge">ID ${dom.escapeHtml(city.id)}</span>
        </div>
        <dl class="detail-list">
          <div><dt>Latitude</dt><dd>${dom.formatCoord(city.latitude)}</dd></div>
          <div><dt>Longitude</dt><dd>${dom.formatCoord(city.longitude)}</dd></div>
        </dl>
        <div class="form-actions">
          <a class="btn btn-light" href="villes.html">← Liste</a>
          <a class="btn btn-blue" href="ville-form.html?id=${city.id}">Modifier</a>
          <button type="button" class="btn btn-danger" id="delete-city">Supprimer</button>
        </div>
      </div>
    `;

    document.getElementById("delete-city").addEventListener("click", async () => {
      if (!confirm(`Supprimer la ville « ${city.name} » ?`)) return;
      try {
        await CityService.remove(city.id);
        showToast(`Ville « ${city.name} » supprimée.`, "success");
        window.location.href = "villes.html";
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  } catch (err) {
    container.innerHTML = `
      <div class="alert">
        ${dom.escapeHtml(err.message)}
        <p><a href="villes.html">Retour à la liste des villes</a></p>
      </div>
    `;
  }
});
