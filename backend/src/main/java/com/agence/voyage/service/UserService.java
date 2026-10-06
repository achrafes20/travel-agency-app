package com.agence.voyage.service;

import com.agence.voyage.dto.UserRequest;
import com.agence.voyage.entity.User;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + id));
    }

    @Transactional
    public User create(UserRequest request) {
        String email = request.getEmail().trim();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Un utilisateur avec cet email existe déjà : " + email);
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("Le mot de passe est obligatoire");
        }
        User user = new User(
                request.getFullName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getRole());
        return userRepository.save(user);
    }

    @Transactional
    public User update(Long id, UserRequest request) {
        User user = findById(id);
        String email = request.getEmail().trim();
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new BusinessException("Un utilisateur avec cet email existe déjà : " + email);
        }
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setRole(request.getRole());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return userRepository.save(user);
    }

    @Transactional
    public User archive(Long id) {
        User user = findById(id);
        user.setArchived(true);
        return userRepository.save(user);
    }

    @Transactional
    public User restore(Long id) {
        User user = findById(id);
        user.setArchived(false);
        return userRepository.save(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = findById(id);
        if (!user.isArchived()) {
            throw new BusinessException("Archivez l'utilisateur avant de le supprimer définitivement");
        }
        try {
            userRepository.delete(user);
            userRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(
                    "Impossible de supprimer cet utilisateur : il est lié à des offres, paniers ou réservations");
        }
    }
}
