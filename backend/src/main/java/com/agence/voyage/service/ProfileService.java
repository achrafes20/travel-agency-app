package com.agence.voyage.service;

import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service @Transactional
public class ProfileService {
    private final UserRepository users;private final AssetAttachmentService assets;private final Clock clock;
    public ProfileService(UserRepository users,AssetAttachmentService assets,Clock clock){this.users=users;this.assets=assets;this.clock=clock;}
    public User actor(Long id){return users.lockNotificationRecipient(id).filter(u->!u.isArchived()).orElseThrow(()->new UnauthorizedException(ErrorCode.ACCOUNT_ARCHIVED,"Compte indisponible"));}
    public UserResponse update(Long id,UpdateProfileRequest request){
        User user=actor(id);
        if(request.email!=null&&!request.email.equalsIgnoreCase(user.getEmail()))throw new BusinessException(ErrorCode.EMAIL_NOT_EDITABLE,"L'adresse e-mail n'est pas modifiable");
        if(request.hasUnknownFields())throw new BusinessException(ErrorCode.INVALID_PROFILE,"Seuls le nom, le téléphone, le pays et l'avatar sont modifiables");
        user.setFullName(name(request.fullName));user.setPhone(phone(request.phone));user.setCountry(country(request.country));
        user.setAvatarUrl(assets.replace(id,FilePurpose.AVATAR,"avatar:"+id,request.avatarUrl));user.setUpdatedAt(LocalDateTime.now(clock));
        return UserResponse.from(user);
    }
    public static String name(String value){
        String name=value==null?"":value.strip();
        if(name.length()<2||name.length()>100||name.codePoints().anyMatch(Character::isISOControl))throw new BusinessException(ErrorCode.INVALID_PROFILE,"Le nom doit contenir 2 à 100 caractères sans caractères de contrôle");
        return name;
    }
    public static String phone(String value){
        if(value==null||value.isBlank())return null;
        String phone=value.replaceAll("[\\s().-]","");
        if(!phone.matches("\\+[1-9][0-9]{7,14}"))throw new BusinessException(ErrorCode.INVALID_PROFILE,"Le téléphone doit être au format international, par exemple +212612345678");
        return phone;
    }
    public static String country(String value){
        if(value==null||value.isBlank())return null;
        String country=value.toUpperCase(Locale.ROOT);
        if(!Set.of(Locale.getISOCountries()).contains(country))throw new BusinessException(ErrorCode.INVALID_PROFILE,"Le pays doit être un code ISO valide");
        return country;
    }
}
