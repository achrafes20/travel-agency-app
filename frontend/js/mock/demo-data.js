/**
 * Atlas Voyage — Données de démonstration et mocks résiduels
 * frontend/js/mock/demo-data.js
 *
 * Mocks isolés servant de secours de prévisualisation lorsque le backend est hors ligne.
 * Chaque donnée porte un indicateur explicite DEMO / MOCK.
 */
(function (root) {
  'use strict';

  const MOCK_INDICATOR = {
    badge: '<span class="demo-badge" style="font-size:9px;padding:2px 6px;border-radius:4px;background:#fef3c7;color:#92400e;font-weight:600;margin-left:6px;">MODE DÉMO</span>',
    isMock: true,
  };

  const MOCK_PHOTOS = {
    riad: '../images/marrakech.jpg',
    blue: '../images/chefchaouen.jpg',
    fes: '../images/fes.jpg',
    desert: '../images/offers/kasbah-ouarzazate.jpg',
  };

  const MockData = {
    indicator: MOCK_INDICATOR,
    photos: MOCK_PHOTOS,
  };

  root.AtlasMockData = MockData;
})(typeof window !== 'undefined' ? window : globalThis);

