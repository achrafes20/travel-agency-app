package com.agence.voyage.config;

import com.agence.voyage.entity.Booking;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.Ticket;
import com.agence.voyage.entity.TicketCategory;
import com.agence.voyage.entity.TicketMessage;
import com.agence.voyage.entity.TicketPriority;
import com.agence.voyage.entity.TicketStatus;
import com.agence.voyage.entity.User;
import com.agence.voyage.repository.BookingRepository;
import com.agence.voyage.repository.TicketRepository;
import com.agence.voyage.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Order(15)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class TicketDemoSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(TicketDemoSeeder.class);

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public TicketDemoSeeder(TicketRepository ticketRepository,
                            UserRepository userRepository,
                            BookingRepository bookingRepository,
                            JdbcTemplate jdbcTemplate,
                            Clock clock) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (ticketRepository.existsByReference("TK-2026-000001")) {
            log.debug("Tickets de démonstration déjà initialisés.");
            return;
        }

        Optional<User> sarahOpt = userRepository.findByEmailIgnoreCase("sarah.benali@example.com");
        Optional<User> nadiaOpt = userRepository.findByEmailIgnoreCase("nadia.elfassi@atlasvoyage.ma");
        Optional<User> omarOpt = userRepository.findByEmailIgnoreCase("omar.tazi@atlasvoyage.ma");
        Optional<User> karimOpt = userRepository.findByEmailIgnoreCase("karim.idrissi@atlasvoyage.ma");

        if (sarahOpt.isEmpty() || nadiaOpt.isEmpty() || omarOpt.isEmpty() || karimOpt.isEmpty()) {
            log.warn("Comptes requis pour le seeding des tickets absents. Seeding ignoré.");
            return;
        }

        User sarah = sarahOpt.get();
        User nadia = nadiaOpt.get();
        User omar = omarOpt.get();
        User karim = karimOpt.get();

        LocalDateTime now = LocalDateTime.now(clock);
        List<Booking> sarahBookings = bookingRepository.findAll().stream()
            .filter(b -> b.getClient() != null && b.getClient().getId().equals(sarah.getId()))
            .toList();
        Booking linkedBooking = sarahBookings.isEmpty() ? null : sarahBookings.get(0);

        // 1. Ticket OPEN (Sarah, sans assigné, lié à une réservation si disponible)
        Ticket t1 = new Ticket("TK-2026-000001",
            "Question sur le transfert aéroport vers le riad",
            TicketCategory.BOOKING,
            TicketPriority.HIGH,
            TicketStatus.OPEN,
            sarah, null, linkedBooking);
        t1.setCreatedAt(now.minusHours(3));
        t1.setUpdatedAt(now.minusHours(3));
        TicketMessage m1 = new TicketMessage(t1, sarah,
            "Bonjour, je souhaiterais savoir si le chauffeur peut nous attendre avec une pancarte à la sortie du terminal 2 de Marrakech Ménara ?",
            false, now.minusHours(3));
        t1.addMessage(m1);
        ticketRepository.save(t1);

        // 2. Ticket IN_PROGRESS (Sarah, assigné à Nadia, avec note interne)
        Ticket t2 = new Ticket("TK-2026-000002",
            "Modification de l'heure d'arrivée à l'hôtel",
            TicketCategory.BOOKING,
            TicketPriority.MEDIUM,
            TicketStatus.IN_PROGRESS,
            sarah, nadia, linkedBooking);
        t2.setCreatedAt(now.minusDays(1).minusHours(2));
        t2.setUpdatedAt(now.minusHours(1));
        TicketMessage m2_1 = new TicketMessage(t2, sarah,
            "Bonjour, notre vol a 2 heures de retard. Est-il possible de prévenir la réception pour le check-in tardif ?",
            false, now.minusDays(1).minusHours(2));
        TicketMessage m2_2 = new TicketMessage(t2, nadia,
            "Note interne : Contacté l'hôtel par téléphone, réception ouverte 24/24. Confirmation reçue par WhatsApp.",
            true, now.minusHours(2));
        TicketMessage m2_3 = new TicketMessage(t2, nadia,
            "Bonjour Sarah, pas d'inquiétude ! Nous avons prévenu la réception du riad. Un veilleur de nuit vous accueillera à votre arrivée.",
            false, now.minusHours(1));
        t2.addMessage(m2_1);
        t2.addMessage(m2_2);
        t2.addMessage(m2_3);
        ticketRepository.save(t2);

        // 3. Ticket RESOLVED (Karim - Fournisseur, assigné à Nadia)
        Ticket t3 = new Ticket("TK-2026-000003",
            "Mise à jour des disponibilités suite à des travaux",
            TicketCategory.OFFER,
            TicketPriority.LOW,
            TicketStatus.RESOLVED,
            karim, nadia, null);
        t3.setCreatedAt(now.minusDays(3));
        t3.setUpdatedAt(now.minusDays(1));
        t3.setResolvedAt(now.minusDays(1));
        TicketMessage m3_1 = new TicketMessage(t3, karim,
            "Bonjour, nous rénovons deux suites juniors la semaine prochaine. Les dates correspondantes ont été bloquées sur le planning.",
            false, now.minusDays(3));
        TicketMessage m3_2 = new TicketMessage(t3, nadia,
            "Bonjour Karim, c'est bien noté et validé côté catalogue. Bon courage pour les travaux !",
            false, now.minusDays(1));
        t3.addMessage(m3_1);
        t3.addMessage(m3_2);
        ticketRepository.save(t3);

        // 4. Ticket CLOSED (Sarah, assigné à Omar - Admin)
        Ticket t4 = new Ticket("TK-2026-000004",
            "Facture acquittée pour le séjour à Marrakech",
            TicketCategory.PAYMENT,
            TicketPriority.MEDIUM,
            TicketStatus.CLOSED,
            sarah, omar, linkedBooking);
        t4.setCreatedAt(now.minusDays(5));
        t4.setUpdatedAt(now.minusDays(4));
        t4.setClosedAt(now.minusDays(4));
        TicketMessage m4_1 = new TicketMessage(t4, sarah,
            "Bonjour, pourriez-vous me transmettre la facture acquittée au format PDF pour ma comptabilité ?",
            false, now.minusDays(5));
        TicketMessage m4_2 = new TicketMessage(t4, omar,
            "Bonjour Sarah, la facture acquittée est désormais téléchargeable directement depuis votre espace réservations.",
            false, now.minusDays(4).minusHours(1));
        TicketMessage m4_3 = new TicketMessage(t4, sarah,
            "Bien reçue, merci beaucoup pour votre réactivité !",
            false, now.minusDays(4));
        t4.addMessage(m4_1);
        t4.addMessage(m4_2);
        t4.addMessage(m4_3);
        ticketRepository.save(t4);

        // Synchronisation de la séquence pour éviter toute collision sur 2026
        jdbcTemplate.update(
            "INSERT INTO ticket_sequence(sequence_year, last_value) VALUES (2026, 4) " +
            "ON DUPLICATE KEY UPDATE last_value = GREATEST(last_value, 4)"
        );

        log.info("Seeding des tickets de démonstration terminé avec succès (4 tickets créés).");
    }
}

