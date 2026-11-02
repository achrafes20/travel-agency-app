package com.agence.voyage.reviews;

import com.agence.voyage.dto.ContactRequest;
import com.agence.voyage.dto.ReviewCreateRequest;
import com.agence.voyage.dto.ReviewModerateRequest;
import com.agence.voyage.dto.ReviewReplyRequest;
import com.agence.voyage.dto.ReviewUpdateRequest;
import com.agence.voyage.entity.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.AppUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:review_integration_${random.uuid};MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ReviewIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private ObjectMapper mapper;

    private User client1;
    private User client2;
    private User supplier;
    private User admin;
    private City city;
    private Offer offer;

    private User createUser(String name, Role role) {
        User u = new User(name, "rev-" + UUID.randomUUID() + "@test.ma", "hash", role);
        u.setEmailVerified(true);
        return userRepository.save(u);
    }

    private Booking createBooking(User client, Offer off, BookingStatus status) {
        Booking b = new Booking();
        b.setReference("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        b.setClient(client);
        b.setStatus(status);
        b.setPaymentStatus(status == BookingStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.PENDING);
        b.setPaymentMethod(PaymentMethod.CARD);
        b.setSubtotal(BigDecimal.valueOf(1000));
        b.setTotal(BigDecimal.valueOf(1000));
        b.setCreatedAt(LocalDateTime.now().minusDays(3));

        BookingItem item = new BookingItem();
        item.setBooking(b);
        item.setOffer(off);
        item.setSupplier(off.getSupplier());
        item.setTitleSnapshot(off.getTitle());
        item.setQuantity(1);
        item.setUnitPrice(BigDecimal.valueOf(off.getBasePrice()));
        item.setLineTotal(BigDecimal.valueOf(off.getBasePrice()));
        item.setServiceStartAt(LocalDateTime.now().minusDays(3));
        item.setServiceEndAt(LocalDateTime.now().minusDays(1));

        b.getItems().add(item);
        return bookingRepository.save(b);
    }

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        bookingRepository.deleteAll();
        offerRepository.deleteAll();
        contactMessageRepository.deleteAll();

        client1 = createUser("Client 1", Role.CLIENT);
        client2 = createUser("Client 2", Role.CLIENT);
        supplier = createUser("Supplier 1", Role.SUPPLIER);
        admin = createUser("Admin", Role.ADMIN);

        city = cityRepository.findAll().stream().findFirst().orElseGet(() -> {
            City c = new City();
            c.setName("Marrakech Test");
            c.setLatitude(31.6295);
            c.setLongitude(-7.9811);
            return cityRepository.save(c);
        });

        Hotel h = new Hotel();
        h.setTitle("Riad Atlas Review Test");
        h.setDescription("Un riad magique");
        h.setBasePrice(1200.0);
        h.setActive(true);
        h.setCity(city);
        h.setSupplier(supplier);
        offer = offerRepository.save(h);
    }

    @Test
    @DisplayName("Un client avec une réservation terminée peut déposer un avis et recalculer la note")
    void testCreateReview_CompletedBooking_Success() throws Exception {
        Booking booking = createBooking(client1, offer, BookingStatus.COMPLETED);

        ReviewCreateRequest req = new ReviewCreateRequest();
        req.setBookingId(booking.getId());
        req.setRating(5);
        req.setTitle("Séjour inoubliable !");
        req.setComment("Service impeccable, chambre très propre et accueil chaleureux.");

        mvc.perform(post("/api/offers/" + offer.getId() + "/reviews")
                        .with(user(new AppUserDetails(client1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.verifiedBooking").value(true));

        Offer updatedOffer = offerRepository.findById(offer.getId()).orElseThrow();
        assertEquals(5.0, updatedOffer.getAverageRating());
        assertEquals(1, updatedOffer.getReviewCount());
    }

    @Test
    @DisplayName("Un avis ne peut pas être déposé pour une réservation non terminée")
    void testCreateReview_PendingBooking_Rejected() throws Exception {
        Booking booking = createBooking(client1, offer, BookingStatus.PENDING);

        ReviewCreateRequest req = new ReviewCreateRequest();
        req.setBookingId(booking.getId());
        req.setRating(4);
        req.setTitle("Bien");
        req.setComment("Très sympa.");

        mvc.perform(post("/api/offers/" + offer.getId() + "/reviews")
                        .with(user(new AppUserDetails(client1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Un mot vulgaire ou sensible place l'avis en PENDING pour modération")
    void testCreateReview_SensitiveWords_Pending() throws Exception {
        Booking booking = createBooking(client1, offer, BookingStatus.COMPLETED);

        ReviewCreateRequest req = new ReviewCreateRequest();
        req.setBookingId(booking.getId());
        req.setRating(1);
        req.setTitle("Une arnaque totale");
        req.setComment("C'est des voleurs et une grosse arnaque !");

        mvc.perform(post("/api/offers/" + offer.getId() + "/reviews")
                        .with(user(new AppUserDetails(client1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));

        // L'offre ne doit pas inclure l'avis PENDING dans sa moyenne
        Offer updatedOffer = offerRepository.findById(offer.getId()).orElseThrow();
        assertEquals(0.0, updatedOffer.getAverageRating());
        assertEquals(0, updatedOffer.getReviewCount());
    }

    @Test
    @DisplayName("L'administrateur peut modérer un avis PENDING et approuver")
    void testModerateReview_AdminApprove() throws Exception {
        Booking booking = createBooking(client1, offer, BookingStatus.COMPLETED);

        Review review = new Review();
        review.setOffer(offer);
        review.setClient(client1);
        review.setBooking(booking);
        review.setRating(4);
        review.setTitle("Avis douteux");
        review.setComment("Commentaire à vérifier");
        review.setStatus(ReviewStatus.PENDING);
        review = reviewRepository.save(review);

        ReviewModerateRequest req = new ReviewModerateRequest();
        req.setStatus(ReviewStatus.APPROVED);
        req.setReason("Vérifié et conforme");

        mvc.perform(post("/api/reviews/" + review.getId() + "/moderate")
                        .with(user(new AppUserDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        Offer updatedOffer = offerRepository.findById(offer.getId()).orElseThrow();
        assertEquals(4.0, updatedOffer.getAverageRating());
        assertEquals(1, updatedOffer.getReviewCount());
    }

    @Test
    @DisplayName("Le fournisseur peut répondre à un avis de son offre")
    void testSupplierReply_Success() throws Exception {
        Booking booking = createBooking(client1, offer, BookingStatus.COMPLETED);

        Review review = new Review();
        review.setOffer(offer);
        review.setClient(client1);
        review.setBooking(booking);
        review.setRating(5);
        review.setTitle("Top");
        review.setComment("Super service");
        review.setStatus(ReviewStatus.APPROVED);
        review = reviewRepository.save(review);

        ReviewReplyRequest req = new ReviewReplyRequest();
        req.setReply("Merci beaucoup pour votre retour positif, au plaisir de vous revoir !");

        mvc.perform(post("/api/reviews/" + review.getId() + "/reply")
                        .with(user(new AppUserDetails(supplier)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplierReply").value(req.getReply()));
    }

    @Test
    @DisplayName("Signalement d'un avis : à 3 signalements, l'avis passe en PENDING")
    void testReportReview_ThresholdReached() throws Exception {
        Booking booking = createBooking(client1, offer, BookingStatus.COMPLETED);

        Review review = new Review();
        review.setOffer(offer);
        review.setClient(client1);
        review.setBooking(booking);
        review.setRating(5);
        review.setTitle("Top");
        review.setComment("Super service");
        review.setStatus(ReviewStatus.APPROVED);
        review.setReportCount(2);
        review = reviewRepository.save(review);

        mvc.perform(post("/api/reviews/" + review.getId() + "/report")
                        .with(user(new AppUserDetails(client2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportCount").value(3))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("Le résumé des avis calcule correctement la distribution et la moyenne")
    void testReviewSummary_Calculation() throws Exception {
        Booking b1 = createBooking(client1, offer, BookingStatus.COMPLETED);
        Booking b2 = createBooking(client2, offer, BookingStatus.COMPLETED);

        Review r1 = new Review();
        r1.setOffer(offer);
        r1.setClient(client1);
        r1.setBooking(b1);
        r1.setRating(5);
        r1.setTitle("Parfait");
        r1.setComment("Génial");
        r1.setStatus(ReviewStatus.APPROVED);
        reviewRepository.save(r1);

        Review r2 = new Review();
        r2.setOffer(offer);
        r2.setClient(client2);
        r2.setBooking(b2);
        r2.setRating(4);
        r2.setTitle("Très bien");
        r2.setComment("Bien");
        r2.setStatus(ReviewStatus.APPROVED);
        reviewRepository.save(r2);

        mvc.perform(get("/api/offers/" + offer.getId() + "/reviews/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.reviewCount").value(2))
                .andExpect(jsonPath("$.distribution.5").value(1))
                .andExpect(jsonPath("$.distribution.4").value(1))
                .andExpect(jsonPath("$.distributionPercentages.5").value(50.0))
                .andExpect(jsonPath("$.distributionPercentages.4").value(50.0));
    }

    @Test
    @DisplayName("Formulaire de contact : pot de miel (honeypot) piège le bot sans enregistrer")
    void testContact_Honeypot() throws Exception {
        ContactRequest req = new ContactRequest();
        req.setName("Spam Bot");
        req.setEmail("bot@spam.com");
        req.setSubject("Achetez des crypto");
        req.setMessage("Cliquez ici www.spam.com");
        req.set_hp("I am a spam bot");

        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertEquals(0, contactMessageRepository.count());
    }

    @Test
    @DisplayName("Formulaire de contact : envoi légitime enregistré avec succès")
    void testContact_Success() throws Exception {
        ContactRequest req = new ContactRequest();
        req.setName("Karim Alami");
        req.setEmail("karim.alami@example.com");
        req.setSubject("Demande d'informations pour un groupe");
        req.setMessage("Bonjour, nous souhaitons organiser un voyage pour 15 personnes en mai.");

        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertEquals(1, contactMessageRepository.count());
        ContactMessage saved = contactMessageRepository.findAll().get(0);
        assertEquals("Karim Alami", saved.getName());
        assertEquals("karim.alami@example.com", saved.getEmail());
    }
}

