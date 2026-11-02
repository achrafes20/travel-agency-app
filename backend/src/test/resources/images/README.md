# Images de test Phase 6

`atlas-fixture.webp` : motif géométrique original 384 × 256, généré localement
avec Canvas/Chrome (bleu Atlas et carré jaune), sans source externe ni métadonnée.
Il vérifie la lecture WebP par le plugin ImageIO Java pur. JPEG et PNG sont générés
dans les tests avec ImageIO ; l'orientation EXIF est construite dans une fixture
JPEG contrôlée. La sortie du serveur est JPEG qualité 85 ou PNG avec transparence.
