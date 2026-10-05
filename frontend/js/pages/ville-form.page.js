/**
 * Page formulaire ville (création / modification).
 */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const cityId = params.get("id");
  const isEdit = Boolean(cityId);

  AdminLayout.mount(
    "villes",
    isEdit ? "Modifier une ville" : "Ajouter une ville",
    isEdit
      ? "Mettez à jour les informations du référentiel."
      : "Enregistrez une nouvelle ville marocaine dans le référentiel.",
    `
      <div class="villes-panel form-panel">
        <div class="breadcrumb">
          <a href="villes.html">Villes</a> / ${isEdit ? "Modification" : "Ajout"}
        </div>
        <form id="city-form" class="admin-form" novalidate>
          <div id="form-alert" class="alert hidden" role="alert"></div>
          <div class="form-grid">
            <label class="form-field">
              <span>Nom de la ville *</span>
              <input type="text" id="name" name="name" required maxlength="120" placeholder="Ex. Marrakech">
            </label>
            <label class="form-field">
              <span>Latitude</span>
              <input type="number" id="latitude" name="latitude" step="0.0001" min="-90" max="90" placeholder="31.6295">
            </label>
            <label class="form-field">
              <span>Longitude</span>
              <input type="number" id="longitude" name="longitude" step="0.0001" min="-180" max="180" placeholder="-7.9811">
            </label>
          </div>
          <p class="form-hint">Les champs marqués * sont obligatoires. La validation métier (unicité du nom) est appliquée par le backend.</p>
          <div class="form-actions">
            <a class="btn btn-light" href="villes.html">Annuler</a>
            <button type="submit" class="btn btn-blue" id="submit-btn">${isEdit ? "Enregistrer" : "Créer la ville"}</button>
          </div>
        </form>
      </div>
    `,
  );

  const form = document.getElementById("city-form");
  const alertEl = document.getElementById("form-alert");
  const submitBtn = document.getElementById("submit-btn");

  function showAlert(message) {
    alertEl.textContent = message;
    alertEl.classList.remove("hidden");
  }

  function readPayload() {
    const name = form.name.value.trim();
    const latRaw = form.latitude.value.trim();
    const lngRaw = form.longitude.value.trim();

    if (!name) {
      throw new Error("Le nom de la ville est obligatoire.");
    }

    return {
      name,
      latitude: latRaw === "" ? null : Number(latRaw),
      longitude: lngRaw === "" ? null : Number(lngRaw),
    };
  }

  if (isEdit) {
    try {
      const city = await CityService.getById(cityId);
      form.name.value = city.name ?? "";
      form.latitude.value = city.latitude ?? "";
      form.longitude.value = city.longitude ?? "";
    } catch (err) {
      showAlert(`Impossible de charger la ville : ${err.message}`);
      submitBtn.disabled = true;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    alertEl.classList.add("hidden");
    submitBtn.disabled = true;

    try {
      const payload = readPayload();
      if (isEdit) {
        await CityService.update(cityId, payload);
        showToast("Ville mise à jour avec succès.", "success");
        window.location.href = `ville-detail.html?id=${cityId}`;
      } else {
        const created = await CityService.create(payload);
        showToast("Ville créée avec succès.", "success");
        window.location.href = `ville-detail.html?id=${created.id}`;
      }
    } catch (err) {
      showAlert(err.message);
      showToast(err.message, "error");
      submitBtn.disabled = false;
    }
  });
});
