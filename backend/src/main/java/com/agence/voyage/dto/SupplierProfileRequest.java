package com.agence.voyage.dto;
import jakarta.validation.constraints.*;
public record SupplierProfileRequest(
    @NotBlank @Size(min=2,max=160) String companyName,
    @Size(max=40) String contactPhone,Long cityId,
    @Size(max=120) String cityName,@DecimalMin("-90") @DecimalMax("90") Double cityLatitude,
    @DecimalMin("-180") @DecimalMax("180") Double cityLongitude,
    @Size(max=500) String address,@Size(max=2000) String description,@Size(max=500) String logoUrl,
    @Size(max=80) String legalForm,@Size(max=80) String registrationNumber,
    @Pattern(regexp="(?:[0-9]{15})?",message="L'ICE doit comporter exactement 15 chiffres") String ice,
    @Size(max=80) String taxId,@Size(max=2000) String legalNotes){}
