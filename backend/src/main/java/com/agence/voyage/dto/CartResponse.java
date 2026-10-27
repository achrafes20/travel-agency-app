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

/** Panier du client avec totaux recalculés à partir des prix et stocks actuels (aucun prix n'est figé dans le panier). */
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

        static Line from(CartItem item) {
            Line l = new Line();
            l.id = item.getId();
            l.quantity = item.getQuantity();
            if (item.getOffer() != null) {
                Offer offer = item.getOffer();
                l.kind = "OFFER";
                l.offerId = offer.getId();
                l.type = OfferService.typeOf(offer);
                l.title = offer.getTitle();
                l.cityName = offer.getCity() != null ? offer.getCity().getName() : null;
                l.image = offer.getImages().isEmpty() ? null : offer.getImages().get(0);
                l.unitPrice = money(offer.getBasePrice());
                l.stock = offer.getStock() == null ? 0 : offer.getStock();
                l.allowsPayOnArrival = Boolean.TRUE.equals(offer.getAllowsPayOnArrival());
                l.available = Boolean.TRUE.equals(offer.getActive()) && l.stock >= l.quantity;
                l.unavailableReason = reason(Boolean.TRUE.equals(offer.getActive()), l.stock, l.quantity);
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
                l.unitPrice = view.getFinalPrice();
                l.stock = view.getStock();
                l.allowsPayOnArrival = false; // un bundle se paie toujours en ligne (cahier des charges 5.3)
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
                return stock == 0 ? "Épuisé" : "Stock insuffisant : " + stock + " disponible(s)";
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
        // paiement à l'arrivée : seulement si toutes les lignes l'acceptent (un bundle ne l'accepte jamais)
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
        double value = code.getValue().doubleValue();
        double raw = code.getDiscountType() == DiscountType.PERCENTAGE ? amount * value / 100 : value;
        return money(Math.min(raw, amount));
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
