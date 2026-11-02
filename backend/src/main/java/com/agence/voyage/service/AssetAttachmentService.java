package com.agence.voyage.service;

import com.agence.voyage.config.StorageProperties;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.FileAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.net.URI;
import java.time.*;
import java.util.*;

@Service @Transactional
public class AssetAttachmentService {
    private final FileAssetRepository files;private final StorageProperties properties;private final Clock clock;
    public AssetAttachmentService(FileAssetRepository files,StorageProperties properties,Clock clock){this.files=files;this.properties=properties;this.clock=clock;}
    public String url(String name){return properties.publicBaseUrl().replaceAll("/$","")+"/api/files/"+name;}
    public String name(String url){
        if(url==null)return null;
        String base=properties.publicBaseUrl().replaceAll("/$","")+"/api/files/";
        if(!url.startsWith(base))return null;
        String name=url.substring(base.length());
        return name.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)")?name:null;
    }
    /** L'appelant est dans la même transaction que la ressource rattachée. */
    public String replace(Long owner,FilePurpose purpose,String key,String value){
        String normalized=value==null||value.isBlank()?null:value.trim();
        FileAsset chosen=null;
        if(normalized!=null){
            String name=name(normalized);
            chosen=name==null?null:files.lockByName(name).orElse(null);
            if(chosen==null||!chosen.owner.getId().equals(owner)||chosen.purpose!=purpose)
                throw new BusinessException(ErrorCode.INVALID_PROFILE,"Choisissez un fichier téléversé sur votre propre compte et pour cet usage");
            if(chosen.attachmentKey!=null&&!key.equals(chosen.attachmentKey))
                throw new BusinessException(ErrorCode.FILE_ATTACHED,"Ce fichier appartient déjà à une autre ressource");
        }
        for(FileAsset old:files.findByAttachmentKey(key))if(chosen==null||!old.id.equals(chosen.id)){old.status=FileAsset.Status.TEMP;old.attachmentKey=null;old.attachedAt=null;old.orphanedAt=LocalDateTime.now(clock);}
        if(chosen!=null){chosen.status=FileAsset.Status.ATTACHED;chosen.attachmentKey=key;chosen.attachedAt=LocalDateTime.now(clock);chosen.orphanedAt=null;}
        return normalized;
    }
    public void replaceOfferImages(Long owner,Long offerId,List<String> values,Set<String> legacy){
        String key="offer:"+offerId;Map<String,FileAsset> selected=new TreeMap<>();
        // Ordre de verrouillage stable, même si l'utilisateur réordonne les images.
        for(String value:new TreeSet<>(values)){
            String name=name(value);
            if(name==null){if(legacy.contains(value))continue;throw new BusinessException(ErrorCode.INVALID_IMAGE,"Téléversez les nouvelles images sur Atlas Voyage");}
            FileAsset file=files.lockByName(name).orElseThrow(()->new BusinessException(ErrorCode.INVALID_IMAGE,"Image téléversée introuvable"));
            if(!file.owner.getId().equals(owner)||file.purpose!=FilePurpose.OFFER_IMAGE)throw new ForbiddenException(ErrorCode.NOT_OWNER,"Cette image n'appartient pas à votre compte fournisseur");
            if(file.attachmentKey!=null&&!key.equals(file.attachmentKey))throw new BusinessException(ErrorCode.FILE_ATTACHED,"Une image ne peut pas être rattachée à plusieurs offres");
            selected.put(file.id,file);
        }
        for(FileAsset old:files.findByAttachmentKey(key))if(!selected.containsKey(old.id)){old.status=FileAsset.Status.TEMP;old.attachmentKey=null;old.attachedAt=null;old.orphanedAt=LocalDateTime.now(clock);}
        for(FileAsset file:selected.values()){file.status=FileAsset.Status.ATTACHED;file.attachmentKey=key;file.attachedAt=LocalDateTime.now(clock);file.orphanedAt=null;}
    }
}
