package com.agence.voyage.service;

import com.agence.voyage.dto.CityRequest;
import com.agence.voyage.entity.City;
import com.agence.voyage.exception.BusinessException;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.CityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CityService {

    private final CityRepository cityRepository;

    public CityService(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    public List<City> findAll() {
        return cityRepository.findAll();
    }

    public City findById(Long id) {
        return cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ville introuvable : id=" + id));
    }

    @Transactional
    public City create(CityRequest request) {
        String name = request.getName().trim();
        if (cityRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Une ville avec ce nom existe déjà : " + name);
        }
        City city = new City(name, request.getLatitude(), request.getLongitude());
        return cityRepository.save(city);
    }

    @Transactional
    public City update(Long id, CityRequest request) {
        City city = findById(id);
        String name = request.getName().trim();
        if (cityRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BusinessException("Une ville avec ce nom existe déjà : " + name);
        }
        city.setName(name);
        city.setLatitude(request.getLatitude());
        city.setLongitude(request.getLongitude());
        return cityRepository.save(city);
    }

    @Transactional
    public void delete(Long id) {
        if (!cityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ville introuvable : id=" + id);
        }
        cityRepository.deleteById(id);
    }
}
