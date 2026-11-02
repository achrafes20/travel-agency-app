package com.agence.voyage.service;

import com.agence.voyage.dto.UserRequest;
import com.agence.voyage.entity.AuditAction;
import com.agence.voyage.entity.Role;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.lang.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       @Nullable AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public List<User> getAllUsers() {
        log.debug("list resource=user");
        return userRepository.findAll();
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + id));
    }

    /** MǦme verrou que change/reset : aucune Ǹcriture admin ne doit perdre une rǸvocation JWT concurrente. */
    private User lockForUpdate(Long id) {
        return userRepository.lockNotificationRecipient(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + id));
    }

    @Transactional
    public User create(UserRequest request) {
        String email = request.getEmail().trim();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException(com.agence.voyage.exception.ErrorCode.DUPLICATE_RESOURCE, "Un utilisateur avec cet email existe dǸj : " + email);
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("Le mot de passe est obligatoire");
        }
        com.agence.voyage.security.PasswordPolicy.require(request.getPassword(), email);
        User user = new User(
                request.getFullName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getRole());
        user.setEmailVerified(true);
        user.setPasswordChangedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        applySupplierCategory(user, request);
        User saved = userRepository.save(user);

        if (auditService != null) {
            auditService.log(AuditAction.USER_CREATED.name(), "USER", saved.getId(),
                    "CrǸation de l'utilisateur " + saved.getEmail(), null, reducedUser(saved));
        }

        return saved;
    }

    @Transactional
    public User update(Long id, UserRequest request) {
        User user = lockForUpdate(id);
        Map<String, Object> before = reducedUser(user);

        String email = request.getEmail().trim();
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new BusinessException(com.agence.voyage.exception.ErrorCode.DUPLICATE_RESOURCE, "Un utilisateur avec cet email existe dǸj : " + email);
        }
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setRole(request.getRole());
        applySupplierCategory(user, request);
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            com.agence.voyage.security.PasswordPolicy.require(request.getPassword(), email);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setTokenVersion(Math.addExact(user.getTokenVersion(), 1));
            user.setPasswordChangedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        }
        user.setUpdatedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        User saved = userRepository.save(user);

        if (auditService != null) {
            auditService.log(AuditAction.USER_UPDATED.name(), "USER", saved.getId(),
                    "Mise  jour de l'utilisateur " + saved.getEmail(), before, reducedUser(saved));
        }

        return saved;
    }

    private static void applySupplierCategory(User user, UserRequest request) {
        if (request.getRole() == Role.SUPPLIER) {
            if (request.getSupplierCategory() == null) throw new BusinessException("La spǸcialitǸ du fournisseur est obligatoire");
            user.setSupplierCategory(request.getSupplierCategory());
        } else user.setSupplierCategory(null);
    }

    @Transactional
    public User archive(Long id) {
        User user = lockForUpdate(id);
        Map<String, Object> before = reducedUser(user);

        user.setArchived(true);
        user.setTokenVersion(Math.addExact(user.getTokenVersion(), 1));
        User saved = userRepository.save(user);

        if (auditService != null) {
            auditService.log(AuditAction.USER_ARCHIVED.name(), "USER", saved.getId(),
                    "Archivage de l'utilisateur " + saved.getEmail(), before, reducedUser(saved));
        }

        return saved;
    }

    @Transactional
    public User restore(Long id) {
        User user = lockForUpdate(id);
        Map<String, Object> before = reducedUser(user);

        user.setArchived(false);
        User saved = userRepository.save(user);

        if (auditService != null) {
            auditService.log(AuditAction.USER_RESTORED.name(), "USER", saved.getId(),
                    "Restauration de l'utilisateur " + saved.getEmail(), before, reducedUser(saved));
        }

        return saved;
    }

    @Transactional
    public void delete(Long id) {
        User user = lockForUpdate(id);
        if (!user.isArchived()) {
            throw new BusinessException("Archivez l'utilisateur avant de le supprimer dǸfinitivement");
        }
        Map<String, Object> before = reducedUser(user);
        try {
            userRepository.delete(user);
            userRepository.flush();

            if (auditService != null) {
                auditService.log(AuditAction.USER_DELETED.name(), "USER", id,
                        "Suppression dǸfinitive de l'utilisateur " + user.getEmail(), before, null);
            }
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(
                    "Impossible de supprimer cet utilisateur : il est liǸ  des offres, paniers ou rǸservations");
        }
    }

    @Transactional
    public User updatePreferences(Long userId, com.agence.voyage.dto.UserPreferencesRequest request) {
        User user = findById(userId);
        if (request.getPreferredLanguage() != null && !request.getPreferredLanguage().isBlank()) {
            user.setPreferredLanguage(request.getPreferredLanguage().trim().toLowerCase());
        }
        if (request.getPreferredCurrency() != null && !request.getPreferredCurrency().isBlank()) {
            user.setPreferredCurrency(request.getPreferredCurrency().trim().toUpperCase());
        }
        return userRepository.save(user);
    }

    private Map<String, Object> reducedUser(User u) {
        if (u == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", u.getId());
        map.put("fullName", u.getFullName());
        map.put("email", u.getEmail());
        map.put("role", u.getRole() != null ? u.getRole().name() : null);
        map.put("archived", u.isArchived());
        return map;
    }
}
