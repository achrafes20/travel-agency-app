package com.agence.voyage.service;
import com.agence.voyage.entity.*;
import java.math.*;
/** La tarification actuelle du panier est par unité, sans multiplicateur implicite de nuit/jour. */
public final class BookingPricing {
 private BookingPricing() {}
 public static BigDecimal money(BigDecimal value) { return value.setScale(2,RoundingMode.HALF_UP); }
 public static BigDecimal offer(Offer offer) { return money(BigDecimal.valueOf(offer.getBasePrice())); }
 public static BigDecimal bundle(Bundle bundle) {
  BigDecimal sum=bundle.getOffers().stream().map(BookingPricing::offer).reduce(BigDecimal.ZERO,BigDecimal::add);
  return money(sum.multiply(BigDecimal.valueOf(100-(bundle.getDiscountPercentage()==null?0:bundle.getDiscountPercentage()))).divide(BigDecimal.valueOf(100)));
 }
 public static BigDecimal discount(PromoCode code, BigDecimal subtotal) {
  if(code==null) return money(BigDecimal.ZERO);
  BigDecimal raw=code.getDiscountType()==DiscountType.PERCENTAGE?subtotal.multiply(code.getValue()).divide(BigDecimal.valueOf(100)):code.getValue();
  return money(raw.min(subtotal).max(BigDecimal.ZERO));
 }
}

