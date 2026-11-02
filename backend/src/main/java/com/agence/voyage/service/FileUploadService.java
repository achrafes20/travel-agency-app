package com.agence.voyage.service;

import com.agence.voyage.config.UploadProperties;
import com.agence.voyage.dto.FileResponse;
import com.agence.voyage.entity.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.FileAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import java.time.*;
import java.util.*;
import java.util.concurrent.Semaphore;

@Service @Transactional
public class FileUploadService {
    private final FileAssetRepository files;private final FileStorageService storage;private final ImageProcessor processor;
    private final ProfileService profiles;private final AssetAttachmentService assets;private final UploadProperties properties;private final Clock clock;private final Semaphore decoders;
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(FileUploadService.class);
    public FileUploadService(FileAssetRepository files,FileStorageService storage,ImageProcessor processor,ProfileService profiles,AssetAttachmentService assets,UploadProperties properties,Clock clock){
        this.files=files;this.storage=storage;this.processor=processor;this.profiles=profiles;this.assets=assets;this.properties=properties;this.clock=clock;decoders=new Semaphore(properties.maxConcurrent());
    }
    public FileResponse upload(Long actor,FilePurpose purpose,MultipartFile upload){
        User user=profiles.actor(actor);if(purpose==null)throw new BusinessException("Le type d'image est obligatoire");
        if(purpose!=FilePurpose.AVATAR&&user.getRole()!=Role.SUPPLIER)throw new ForbiddenException("Cet usage est réservé aux fournisseurs");
        if(upload==null||upload.isEmpty())throw new BusinessException(ErrorCode.INVALID_IMAGE,"Sélectionnez une image");
        if(upload.getSize()>properties.maxSizeBytes())throw new BusinessException(ErrorCode.UPLOAD_TOO_LARGE,HttpStatus.PAYLOAD_TOO_LARGE,"L'image dépasse la limite de "+properties.maxSizeBytes()+" octets");
        if(files.countByOwnerIdAndStatus(actor,FileAsset.Status.TEMP)>=properties.maxTempFiles())throw new BusinessException(ErrorCode.FILE_QUOTA_EXCEEDED,HttpStatus.CONFLICT,"Le quota d'images temporaires est atteint. Supprimez les images inutiles");
        if(!decoders.tryAcquire())throw new AuthRateLimitException(2);
        try{
            ImageProcessor.Processed image;
            try{image=processor.process(upload.getBytes());}catch(java.io.IOException ex){throw new BusinessException(ErrorCode.INVALID_IMAGE,"Image illisible");}
            FileAsset file=new FileAsset();file.owner=user;file.purpose=purpose;file.storedName=UUID.randomUUID()+"."+image.extension();file.thumbnailName=UUID.randomUUID()+"."+image.extension();
            file.originalSize=upload.getSize();file.storedSize=image.original().length;file.width=image.width();file.height=image.height();file.contentType=image.contentType();file.createdAt=LocalDateTime.now(clock);
            // Nettoyage compensatoire si la transaction DB échoue après l'écriture sur disque.
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED){safeDelete(file.storedName);safeDelete(file.thumbnailName);}}});
            storage.store(file.storedName,image.original());storage.store(file.thumbnailName,image.thumbnail());files.saveAndFlush(file);
            log.info("image_uploaded assetId={} purpose={}",file.id,purpose);
            return new FileResponse(file.id,assets.url(file.storedName),assets.url(file.thumbnailName),file.width,file.height,file.storedSize,file.contentType,purpose);
        }catch(BusinessException ex){log.info("image_refused code={}",ex.getCode());throw ex;}finally{decoders.release();}
    }
    public void delete(Long actor,String id){
        User user=profiles.actor(actor);
        // Charger directement sous verrou : ne pas réutiliser un état TEMP lu avant un rattachement concurrent.
        FileAsset file=files.lockById(id).orElseThrow(()->new ResourceNotFoundException("Image introuvable"));
        if(user.getRole()!=Role.ADMIN&&!file.owner.getId().equals(actor))throw new ForbiddenException("Cette image appartient à un autre compte");
        if(file.status==FileAsset.Status.ATTACHED)throw new BusinessException(ErrorCode.FILE_ATTACHED,HttpStatus.CONFLICT,"Retirez d'abord cette image du profil ou de l'offre qui l'utilise");
        remove(file);
    }
    public void remove(FileAsset file){
        files.delete(file);files.flush();TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){safeDelete(file.storedName);safeDelete(file.thumbnailName);}});
    }
    private void safeDelete(String name){try{storage.delete(name);}catch(Exception ex){log.warn("image_disk_cleanup_failed");}}
}
