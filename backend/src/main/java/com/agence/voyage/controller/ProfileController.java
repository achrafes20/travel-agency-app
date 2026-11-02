package com.agence.voyage.controller;
import com.agence.voyage.dto.*;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController @Tag(name="Profils",description="Profil personnel pour tous les rôles ; entreprise SUPPLIER et lecture ADMIN.")
public class ProfileController {
    private final ProfileService profiles;private final SupplierProfileService suppliers;private final com.agence.voyage.config.UploadProperties upload;
    public ProfileController(ProfileService profiles,SupplierProfileService suppliers,com.agence.voyage.config.UploadProperties upload){this.profiles=profiles;this.suppliers=suppliers;this.upload=upload;}
    @GetMapping("/api/auth/profile-options") @Operation(summary="Lire les pays ISO et limites d'images",description="Authentifié ; paramètres destinés aux formulaires.")
    public ProfileOptions options(){return new ProfileOptions(java.util.Arrays.stream(java.util.Locale.getISOCountries()).map(code->new ProfileOptions.Country(code,new java.util.Locale.Builder().setRegion(code).build().getDisplayCountry(java.util.Locale.FRENCH))).sorted(java.util.Comparator.comparing(ProfileOptions.Country::name)).toList(),upload.maxSizeBytes(),upload.maxPixels(),200,6000);}
    @PutMapping("/api/auth/profile") @Operation(summary="Mettre à jour mon profil",description="Authentifié ; email et autorisations non modifiables.")
    public UserResponse update(@AuthenticationPrincipal AppUserDetails u,@Valid @RequestBody UpdateProfileRequest r){return profiles.update(u.getId(),r);}
    @GetMapping("/api/suppliers/me/profile") @Operation(summary="Lire mon profil fournisseur")
    public SupplierProfileResponse supplier(@AuthenticationPrincipal AppUserDetails u){return suppliers.get(u.getId());}
    @PutMapping("/api/suppliers/me/profile") @Operation(summary="Modifier mon profil fournisseur")
    public SupplierProfileResponse supplierUpdate(@AuthenticationPrincipal AppUserDetails u,@Valid @RequestBody SupplierProfileRequest r){return suppliers.update(u.getId(),r);}
    @GetMapping("/api/suppliers/{id}/profile") @Operation(summary="Lire un fournisseur",description="ADMIN uniquement.")
    public SupplierProfileResponse supplierAdmin(@AuthenticationPrincipal AppUserDetails u,@PathVariable Long id){return suppliers.admin(u.getId(),id);}
}
