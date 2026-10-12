package com.agence.voyage.repository;

import com.agence.voyage.entity.Bundle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BundleRepository extends JpaRepository<Bundle, Long> {

    List<Bundle> findByCreatedById(Long agentId);
}
