/**
 * Page liste des villes — présentation uniquement.
 * Données et règles métier : backend CityController → CityService → CityRepository.
 */
document.addEventListener("DOMContentLoaded", async () => {
  AdminLayout.mount(
    "villes",
    "Gestion des villes",
    "Référentiel géographique utilisé par le catalogue et les offres.",
    `
      <div class="admin-table-wrap villes-panel">
        <div class="table-head">
          <h2>Liste des villes</h2>
          <div class="table-actions">
            <span id="cities-count" class="muted-label">Chargement…</span>
            <a class="btn btn-blue" href="ville-form.html">+ Ajouter une ville</a>
          </div>
        </div>
        <div id="cities-alert" class="alert hidden" role="alert"></div>
        <div class="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ville</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="cities-tbody">
              <tr><td colspan="5">Chargement des villes…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
  );

  const tbody = document.getElementById("cities-tbody");
  const countEl = document.getElementById("cities-count");
  const alertEl = document.getElementById("cities-alert");

  function showAlert(message) {
    alertEl.textContent = message;
    alertEl.classList.remove("hidden");
  }

  function renderRows(cities) {
    countEl.textContent = `${cities.length} ville${cities.length !== 1 ? "s" : ""}`;
    if (!cities.length) {
      tbody.innerHTML =
        '<tr><td colspan="5">Aucune ville enregistrée. <a href="ville-form.html">Ajouter la première ville</a></td></tr>';
      return;
    }

    tbody.innerHTML = cities
      .map(
        (city) => `
        <tr>
          <td><strong>${dom.escapeHtml(city.id)}</strong></td>
          <td>${dom.escapeHtml(city.name)}</td>
          <td>${dom.formatCoord(city.latitude)}</td>
          <td>${dom.formatCoord(city.longitude)}</td>
          <td class="actions-cell">
            <a class="btn btn-light btn-sm" href="ville-detail.html?id=${city.id}">Détail</a>
            <a class="btn btn-light btn-sm" href="ville-form.html?id=${city.id}">Modifier</a>
            <button type="button" class="btn btn-danger btn-sm" data-delete="${city.id}" data-name="${dom.escapeHtml(city.name)}">Supprimer</button>
          </td>
        </tr>`,
      )
      .join("");

    tbody.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.delete;
        const name = btn.dataset.name;
        if (!confirm(`Supprimer la ville « ${name} » ?`)) return;
        try {
          await CityService.remove(id);
          showToast(`Ville « ${name} » supprimée.`, "success");
          await loadCities();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  async function loadCities() {
    try {
      const cities = await CityService.getAll();
      renderRows(cities);
    } catch (err) {
      countEl.textContent = "Erreur";
      tbody.innerHTML = `<tr><td colspan="5">Impossible de charger les villes : ${dom.escapeHtml(err.message)}</td></tr>`;
      showAlert(
        "Vérifiez que le backend Spring Boot est démarré sur le port 8080 (mvnw spring-boot:run).",
      );
    }
  }

  await loadCities();
});
