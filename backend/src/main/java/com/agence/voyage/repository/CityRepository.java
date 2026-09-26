package com.agence.voyage.repository;

import com.agence.voyage.model.City;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CityRepository extends JpaRepository<City, Long> {
}
