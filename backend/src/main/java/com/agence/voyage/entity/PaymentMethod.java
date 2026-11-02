package com.agence.voyage.entity;

public enum PaymentMethod {
    ONLINE, PAY_ON_ARRIVAL, CARD, CASH_ON_ARRIVAL,
    /** Compatibilité des anciens paiements uniquement. */
    SIMULATED, ON_ARRIVAL
}
