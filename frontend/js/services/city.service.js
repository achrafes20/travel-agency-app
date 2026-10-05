/**
 * Service métier côté client — orchestration des appels API Villes.
 * La validation métier reste côté backend (CityService).
 */
const CityService = {
  getAll() {
    return api.get("/api/cities");
  },

  getById(id) {
    return api.get(`/api/cities/${id}`);
  },

  create(payload) {
    return api.post("/api/cities", payload);
  },

  update(id, payload) {
    return api.put(`/api/cities/${id}`, payload);
  },

  remove(id) {
    return api.delete(`/api/cities/${id}`);
  },
};
