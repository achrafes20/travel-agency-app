package com.agence.voyage.dto;

import com.agence.voyage.entity.Bundle;
import com.agence.voyage.entity.Cart;
import com.agence.voyage.entity.CartItem;
import com.agence.voyage.entity.DiscountType;
import com.agence.voyage.entity.Offer;
import com.agence.voyage.entity.OfferType;
import com.agence.voyage.entity.PromoCode;
import com.agence.voyage.service.OfferService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/** Panier avec prix recalculés et capacités résiduelles ; les snapshots définitifs appartiennent à Booking. */
public class CartResponse {

    private Long id;
    private List<Line> items;
    private int itemCount;
    private Double subtotal;
    private Promo promo;
    private Double discount;
    private Double total;
    private boolean payOnArrivalAllowed;
    private boolean hasUnavailableItems;
    private String promoWarning;

    public static class Line {
        private Long id;
        private String kind;
        private Long offerId;
        private Long bundleId;
        private OfferType type;
        private String title;
        private String cityName;
        private String image;
        private Double unitPrice;
        private Integer quantity;
        private Double lineTotal;
        private Integer stock;
        private boolean allowsPayOnArrival;
        private boolean available;
        private String unavailableReason;
        private String travelCriteria;

        static Line from(CartItem item) {
            Line l = new Line();
            l.id = item.getId();
            l.quantity = item.getQuantity();
            l.travelCriteria = item.getTravelCriteria();
            if (item.getOffer() != null) {
                Offer offer = item.getOffer();
                l.kind = "OFFER";
                l.offerId = offer.getId();
                l.type = OfferService.typeOf(offer);
                l.title = offer.getTitle();
                l.cityName = offer.getCity() != null ? offer.getCity().getName() : null;
                l.image = offer.getImages().isEmpty() ? null : offer.getImages().get(0);
                l.unitPrice = com.agence.voyage.service.BookingPricing.offer(offer).doubleValue();
                l.stock = remainingCapacity(offer, item.getTravelCriteria());
                l.allowsPayOnArrival = Boolean.TRUE.equals(offer.getAllowsPayOnArrival());
                l.available = Boolean.TRUE.equals(offer.getActive()) && l.stock >= l.quantity;
                l.unavailableReason = reason(Boolean.TRUE.equals(offer.getActive()), l.stock, l.quantity);
                if (offer.getAvailabilities().isEmpty() && l.unavailableReason != null && Boolean.TRUE.equals(offer.getActive()))
                    l.unavailableReason = l.stock == 0 ? "Épuisé" : "Stock insuffisant : " + l.stock + " disponible(s)";
            } else {
                Bundle bundle = item.getBundle();
                BundleResponse view = BundleResponse.from(bundle);
                boolean allActive = bundle.getOffers().stream().allMatch(o -> Boolean.TRUE.equals(o.getActive()));
                l.kind = "BUNDLE";
                l.bundleId = bundle.getId();
                l.title = bundle.getTitle();
                l.cityName = String.join(", ", view.getCities());
                l.image = bundle.getOffers().stream()
                        .map(o -> o.getImages().isEmpty() ? null : o.getImages().get(0))
                        .filter(Objects::nonNull).findFirst().orElse(null);
                l.unitPrice = com.agence.voyage.service.BookingPricing.bundle(bundle).doubleValue();
                l.stock = bundle.getOffers().stream().mapToInt(o -> remainingCapacity(o, item.getTravelCriteria())).min().orElse(0);
                l.allowsPayOnArrival = bundle.getOffers().stream().allMatch(o -> Boolean.TRUE.equals(o.getAllowsPayOnArrival()));
                l.available = allActive && l.stock >= l.quantity;
                l.unavailableReason = reason(allActive, l.stock, l.quantity);
            }
            l.lineTotal = money(l.unitPrice * l.quantity);
            return l;
        }

        private static String reason(boolean active, int stock, int quantity) {
            if (!active) {
                return "Cette offre n'est plus disponible";
            }
            if (stock < quantity) {
                return stock == 0 ? "Indisponible aux dates demandées" : "Capacité insuffisante : " + stock + " disponible(s)";
            }
            return null;
        }

        public Long getId() {
            return id;
        }

        public String getKind() {
            return kind;
        }

        public Long getOfferId() {
            return offerId;
        }

        public Long getBundleId() {
            return bundleId;
        }

        public OfferType getType() {
            return type;
        }

        public String getTitle() {
            return title;
        }

        public String getCityName() {
            return cityName;
        }

        public String getImage() {
            return image;
        }

        public Double getUnitPrice() {
            return unitPrice;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public Double getLineTotal() {
            return lineTotal;
        }

        public Integer getStock() {
            return stock;
        }

        public boolean isAllowsPayOnArrival() {
            return allowsPayOnArrival;
        }

        public boolean isAvailable() {
            return available;
        }

        public String getUnavailableReason() {
            return unavailableReason;
        }

        public String getTravelCriteria() {
            return travelCriteria;
        }
    }

    private static int remainingCapacity(Offer offer, String travel) {
        // Compatibilité des anciennes offres sans calendrier ; Booking ne possède aucun repli sur stock.
        if (offer.getAvailabilities().isEmpty()) return offer.getStock() == null ? 0 : offer.getStock();
        var range = com.agence.voyage.service.CartService.requestedPeriod(travel);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        return offer.getAvailabilities().stream().filter(a -> a.getEndAt().isAfter(now))
            .filter(a -> range[0] == null || (offer instanceof com.agence.voyage.entity.Flight
                || offer instanceof com.agence.voyage.entity.Excursion
                ? !range[0].toLocalDate().isBefore(a.getStartAt().toLocalDate()) && !range[0].toLocalDate().isAfter(a.getEndAt().toLocalDate())
                : !a.getStartAt().isAfter(range[0]) && (range[1] == null || !a.getEndAt().isBefore(range[1]))))
            .mapToInt(com.agence.voyage.entity.OfferAvailability::getCapacity).max().orElse(0);
    }

    public static class Promo {
        private String code;
        private DiscountType discountType;
        private BigDecimal value;

        public String getCode() {
            return code;
        }

        public DiscountType getDiscountType() {
            return discountType;
        }

        public BigDecimal getValue() {
            return value;
        }
    }

    /** @param promoWarning message affiché quand le code du panier vient d'être retiré parce qu'il n'est plus valide */
    public static CartResponse from(Cart cart, String promoWarning) {
        CartResponse r = new CartResponse();
        r.id = cart.getId();
        r.items = cart.getItems().stream().map(Line::from).toList();
        r.itemCount = r.items.stream().mapToInt(Line::getQuantity).sum();
        r.subtotal = money(r.items.stream().mapToDouble(Line::getLineTotal).sum());
        r.hasUnavailableItems = r.items.stream().anyMatch(l -> !l.isAvailable());
        // Paiement à l'arrivée : chaque offre, y compris les composants des bundles, doit l'accepter.
        r.payOnArrivalAllowed = !r.items.isEmpty() && r.items.stream().allMatch(Line::isAllowsPayOnArrival);

        PromoCode code = cart.getPromoCode();
        if (code != null) {
            r.promo = new Promo();
            r.promo.code = code.getCode();
            r.promo.discountType = code.getDiscountType();
            r.promo.value = code.getValue();
            r.discount = discount(code, r.subtotal);
        } else {
            r.discount = 0.0;
        }
        r.total = money(r.subtotal - r.discount);
        r.promoWarning = promoWarning;
        return r;
    }

    /** Réduction d'un code sur un montant : jamais supérieure au montant (le total ne devient pas négatif). */
    public static double discount(PromoCode code, double amount) {
        return com.agence.voyage.service.BookingPricing.discount(code, BigDecimal.valueOf(amount)).doubleValue();
    }

    private static double money(Double value) {
        return Math.round((value == null ? 0 : value) * 100.0) / 100.0;
    }

    public Long getId() {
        return id;
    }

    public List<Line> getItems() {
        return items;
    }

    public int getItemCount() {
        return itemCount;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public Promo getPromo() {
        return promo;
    }

    public Double getDiscount() {
        return discount;
    }

    public Double getTotal() {
        return total;
    }

    public boolean isPayOnArrivalAllowed() {
        return payOnArrivalAllowed;
    }

    public boolean isHasUnavailableItems() {
        return hasUnavailableItems;
    }

    public String getPromoWarning() {
        return promoWarning;
    }
}
