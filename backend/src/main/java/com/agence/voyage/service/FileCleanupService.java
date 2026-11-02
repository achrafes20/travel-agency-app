package com.agence.voyage.service;
import com.agence.voyage.entity.FileAsset;
import com.agence.voyage.repository.FileAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import java.time.*;
import java.nio.file.*;
import java.util.*;
@Service
public class FileCleanupService {
    private final FileAssetRepository files;private final FileStorageService storage;private final FileUploadService upload;private final Clock clock;
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(FileCleanupService.class);
    public FileCleanupService(FileAssetRepository files,FileStorageService storage,FileUploadService upload,Clock clock){this.files=files;this.storage=storage;this.upload=upload;this.clock=clock;}
    @Transactional public int purgeExpired(boolean dryRun){
        var ids=files.expired(LocalDateTime.now(clock).minusHours(24),PageRequest.of(0,200));int count=0;
        // La sélection ne charge que les identifiants ; l'état est relu après acquisition du verrou.
        for(String id:ids){var file=files.lockById(id).orElse(null);
            if(file!=null&&file.status==FileAsset.Status.TEMP&&(file.orphanedAt==null?file.createdAt:file.orphanedAt).isBefore(LocalDateTime.now(clock).minusHours(24))){count++;if(!dryRun)upload.remove(file);}}
        if(count>0)log.info("image_temp_cleanup candidates={} dryRun={}",count,dryRun);return count;
    }
    public int reconcile(boolean dryRun){
        // Fenêtre de 24h : ne pas effacer un fichier d'upload dont la transaction n'a pas encore été validée.
        int count=0;Instant before=clock.instant().minus(Duration.ofHours(24));
        try(var disk=storage.list()){
            for(var iterator=disk.iterator();iterator.hasNext();){Path path=iterator.next();
                String name=path.getFileName().toString();if(!name.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)")||Files.isSymbolicLink(path)||!Files.isRegularFile(path))continue;
                try{if(!Files.getLastModifiedTime(path).toInstant().isBefore(before)||files.findByStoredNameOrThumbnailName(name,name).isPresent())continue;
                    count++;if(!dryRun)storage.delete(name);
                }catch(java.io.IOException ex){log.warn("image_reconcile_entry_failed");}
            }
        }
        if(count>0)log.info("image_reconciliation candidates={} dryRun={}",count,dryRun);return count;
    }
}
