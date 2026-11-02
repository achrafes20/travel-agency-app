package com.agence.voyage.dto;
import com.agence.voyage.entity.SupplierProfile;
import java.time.LocalDateTime;
public record SupplierProfileResponse(Long userId,String companyName,String contactPhone,CityResponse city,
    String address,String description,String logoUrl,String legalForm,String registrationNumber,String ice,
    String taxId,String legalNotes,LocalDateTime createdAt,LocalDateTime updatedAt){
    public static SupplierProfileResponse from(SupplierProfile p){return new SupplierProfileResponse(p.user.getId(),p.companyName,p.contactPhone,
        p.city==null?null:CityResponse.from(p.city),p.address,p.description,p.logoUrl,p.legalForm,p.registrationNumber,p.ice,p.taxId,p.legalNotes,p.createdAt,p.updatedAt);}
}
