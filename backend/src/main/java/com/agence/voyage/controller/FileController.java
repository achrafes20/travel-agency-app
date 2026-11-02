package com.agence.voyage.controller;
import com.agence.voyage.dto.FileResponse;
import com.agence.voyage.entity.FilePurpose;
import com.agence.voyage.exception.ResourceNotFoundException;
import com.agence.voyage.repository.FileAssetRepository;
import com.agence.voyage.service.*;
import com.agence.voyage.security.AppUserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.*;
import org.springframework.core.io.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.Duration;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController @RequestMapping("/api/files") @Tag(name="Images",description="Lecture publique des images réencodées. Mutations authentifiées et contrôlées par propriétaire/usage.")
public class FileController {
    private final FileUploadService service;private final FileStorageService storage;private final FileAssetRepository files;
    public FileController(FileUploadService service,FileStorageService storage,FileAssetRepository files){this.service=service;this.storage=storage;this.files=files;}
    @PostMapping(value="/images",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary="Téléverser une image",description="file multipart unique ; purpose AVATAR tous rôles, OFFER_IMAGE/SUPPLIER_LOGO SUPPLIER.")
    public FileResponse upload(@AuthenticationPrincipal AppUserDetails user,@RequestParam FilePurpose purpose,@RequestParam MultipartFile file,jakarta.servlet.http.HttpServletRequest request){
        var multipart=org.springframework.web.util.WebUtils.getNativeRequest(request,org.springframework.web.multipart.MultipartHttpServletRequest.class);
        if(multipart==null||multipart.getMultiFileMap().values().stream().mapToLong(java.util.List::size).sum()!=1)
            throw new com.agence.voyage.exception.BusinessException("Une seule image est acceptée par requête");
        return service.upload(user.getId(),purpose,file);
    }
    @GetMapping("/{name}") @Operation(summary="Lire une image ou sa miniature",description="Public ; name=UUID.extension, nosniff, cache un an.")
    public ResponseEntity<Resource> read(@PathVariable("name") String storedName){
        var path=storage.resolve(storedName);var file=files.findByStoredNameOrThumbnailName(storedName,storedName).orElseThrow(()->new ResourceNotFoundException("Image introuvable"));
        if(!storage.exists(storedName))throw new ResourceNotFoundException("Image introuvable");
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType)).header("X-Content-Type-Options","nosniff")
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.inline().filename(storedName).build().toString())
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable()).body(new FileSystemResource(path));
    }
    @DeleteMapping("/{name}") @ResponseStatus(HttpStatus.NO_CONTENT) @Operation(summary="Supprimer une image temporaire",description="name=UUID d'asset. Propriétaire ou ADMIN. Une image rattachée doit d'abord être retirée de sa ressource.")
    public void delete(@AuthenticationPrincipal AppUserDetails user,@PathVariable("name") String id){service.delete(user.getId(),id);}
}
