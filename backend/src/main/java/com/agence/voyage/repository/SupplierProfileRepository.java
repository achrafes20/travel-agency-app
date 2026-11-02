package com.agence.voyage.repository;
import com.agence.voyage.entity.SupplierProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SupplierProfileRepository extends JpaRepository<SupplierProfile,Long> {
    Optional<SupplierProfile> findByUserId(Long id);
}
