package com.agence.voyage.service;
import java.nio.file.Path;
import java.util.stream.Stream;
/** Les clés sont des noms serveur UUID, jamais des chemins du client. */
public interface FileStorageService {
    void store(String name,byte[] bytes);
    Path resolve(String name);
    boolean exists(String name);
    void delete(String name);
    Stream<Path> list();
}
