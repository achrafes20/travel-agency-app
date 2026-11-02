package com.agence.voyage.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.validation.constraints.*;
import java.util.*;

/** Liste explicite de champs ; aucune propriété d'autorisation n'est affectée. */
public class UpdateProfileRequest {
    @NotBlank @Size(max=100) public String fullName;
    @Size(max=40) public String phone;
    @Size(max=2) public String country;
    @Size(max=500) public String avatarUrl;
    public String email;
    private final Map<String,Object> unknown=new HashMap<>();
    @JsonAnySetter public void unknown(String key,Object value){unknown.put(key,value);}
    public boolean hasUnknownFields(){return !unknown.isEmpty();}
}
