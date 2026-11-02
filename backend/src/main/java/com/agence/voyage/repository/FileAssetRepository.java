package com.agence.voyage.repository;
import com.agence.voyage.entity.FileAsset;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface FileAssetRepository extends JpaRepository<FileAsset,String> {
    Optional<FileAsset> findByStoredNameOrThumbnailName(String stored,String thumbnail);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select f from FileAsset f where f.storedName=:name")
    Optional<FileAsset> lockByName(String name);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select f from FileAsset f where f.id=:id")
    Optional<FileAsset> lockById(String id);
    long countByOwnerIdAndStatus(Long id,FileAsset.Status status);
    List<FileAsset> findByAttachmentKey(String key);
    @Query("select f.id from FileAsset f where f.status='TEMP' and coalesce(f.orphanedAt,f.createdAt)<:before order by f.storedName")
    List<String> expired(java.time.LocalDateTime before,org.springframework.data.domain.Pageable page);
}
