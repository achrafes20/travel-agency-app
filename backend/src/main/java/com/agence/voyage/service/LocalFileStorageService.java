package com.agence.voyage.service;
import com.agence.voyage.config.StorageProperties;
import com.agence.voyage.exception.*;
import org.springframework.stereotype.Service;
import java.nio.file.*;
import java.io.*;
import java.util.stream.Stream;

@Service
public class LocalFileStorageService implements FileStorageService {
    private final Path root;
    public LocalFileStorageService(StorageProperties properties){
        try{Path configured=Path.of(properties.local().root()).toAbsolutePath().normalize();Files.createDirectories(configured);root=configured.toRealPath();}
        catch(IOException ex){throw new IllegalStateException("Le dossier d'upload est inaccessible",ex);}
    }
    @Override public Path resolve(String name){
        if(name==null||!name.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)"))throw new ResourceNotFoundException("Fichier introuvable");
        Path path=root.resolve(name).normalize();if(!path.startsWith(root)||Files.isSymbolicLink(path))throw new ResourceNotFoundException("Fichier introuvable");return path;
    }
    @Override public void store(String name,byte[] bytes){
        Path path=resolve(name),temporary=null;
        try{temporary=resolve(java.util.UUID.randomUUID()+".png");Files.write(temporary,bytes,StandardOpenOption.CREATE_NEW);Files.move(temporary,path,StandardCopyOption.ATOMIC_MOVE);}
        catch(IOException ex){throw new IllegalStateException("Impossible d'enregistrer l'image",ex);}
        finally{if(temporary!=null)try{Files.deleteIfExists(temporary);}catch(IOException ignored){}}
    }
    @Override public boolean exists(String name){return Files.isRegularFile(resolve(name),LinkOption.NOFOLLOW_LINKS);}
    @Override public void delete(String name){try{Files.deleteIfExists(resolve(name));}catch(IOException ex){throw new IllegalStateException("Impossible de supprimer l'image",ex);}}
    @Override public Stream<Path> list(){try{return Files.list(root);}catch(IOException ex){throw new IllegalStateException("Dossier d'images inaccessible",ex);}}
}
