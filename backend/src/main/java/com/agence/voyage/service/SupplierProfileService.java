package com.agence.voyage.service;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Service @Transactional
public class SupplierProfileService {
    private final ProfileService profiles;private final SupplierProfileRepository repository;private final CityRepository cities;
    private final UserRepository users;private final AssetAttachmentService assets;private final Clock clock;
    public SupplierProfileService(ProfileService profiles,SupplierProfileRepository repository,CityRepository cities,UserRepository users,AssetAttachmentService assets,Clock clock){
        this.profiles=profiles;this.repository=repository;this.cities=cities;this.users=users;this.assets=assets;this.clock=clock;
    }
    private SupplierProfile own(Long id){
        User u=profiles.actor(id);if(u.getRole()!=Role.SUPPLIER)throw new ForbiddenException("Profil réservé aux fournisseurs");
        return ensure(u);
    }
    private SupplierProfile ensure(User u){return repository.findByUserId(u.getId()).orElseGet(()->{SupplierProfile p=new SupplierProfile();p.user=u;p.createdAt=p.updatedAt=LocalDateTime.now(clock);return repository.save(p);});}
    public SupplierProfileResponse get(Long actor){return SupplierProfileResponse.from(own(actor));}
    public SupplierProfileResponse admin(Long actor,Long supplier){
        if(profiles.actor(actor).getRole()!=Role.ADMIN)throw new ForbiddenException("Accès administrateur requis");
        User u=users.lockNotificationRecipient(supplier).filter(v->v.getRole()==Role.SUPPLIER).orElseThrow(()->new ResourceNotFoundException("Fournisseur introuvable"));
        return SupplierProfileResponse.from(ensure(u));
    }
    public SupplierProfileResponse update(Long id,SupplierProfileRequest r){
        SupplierProfile p=own(id);p.companyName=r.companyName().strip();p.contactPhone=ProfileService.phone(r.contactPhone());
        if(r.cityId()!=null)p.city=cities.findById(r.cityId()).orElseThrow(()->new ResourceNotFoundException("Ville introuvable"));
        else if(r.cityName()!=null&&!r.cityName().isBlank()&&r.cityLatitude()!=null&&r.cityLongitude()!=null)
            p.city=cities.findByNameIgnoreCase(r.cityName().strip()).orElseGet(()->cities.save(new City(r.cityName().strip(),r.cityLatitude(),r.cityLongitude())));
        else throw new BusinessException(ErrorCode.INVALID_PROFILE,"Recherchez puis sélectionnez une ville avec ses coordonnées");
        p.address=trim(r.address());p.description=trim(r.description());p.legalForm=trim(r.legalForm());
        p.registrationNumber=trim(r.registrationNumber());p.ice=trim(r.ice());p.taxId=trim(r.taxId());p.legalNotes=trim(r.legalNotes());
        p.logoUrl=assets.replace(id,FilePurpose.SUPPLIER_LOGO,"logo:"+id,r.logoUrl());p.updatedAt=LocalDateTime.now(clock);
        return SupplierProfileResponse.from(p);
    }
    private static String trim(String value){return value==null||value.isBlank()?null:value.strip();}
}
