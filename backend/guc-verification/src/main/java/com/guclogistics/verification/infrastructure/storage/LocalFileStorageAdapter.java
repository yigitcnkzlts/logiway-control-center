package com.guclogistics.verification.infrastructure.storage;

import com.guclogistics.verification.application.port.FileStoragePort;
import com.guclogistics.shared.exception.DomainException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Component
@Slf4j
public class LocalFileStorageAdapter implements FileStoragePort {

    private final Path basePath;

    public LocalFileStorageAdapter(@Value("${guc.storage.local-path:./data/uploads}") String localPath) {
        this.basePath = Path.of(localPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.basePath);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create storage directory: " + this.basePath, e);
        }
    }

    @Override
    public String store(String relativeKey, InputStream content, long sizeBytes, String mimeType) {
        Path target = resolve(relativeKey);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
            return relativeKey;
        } catch (IOException e) {
            log.error("Failed to store file {}", relativeKey, e);
            throw DomainException.business("Failed to store document");
        }
    }

    @Override
    public InputStream read(String storageKey) {
        Path target = resolve(storageKey);
        try {
            return Files.newInputStream(target);
        } catch (IOException e) {
            throw DomainException.notFound("Document file not found");
        }
    }

    private Path resolve(String relativeKey) {
        Path resolved = basePath.resolve(relativeKey).normalize();
        if (!resolved.startsWith(basePath)) {
            throw DomainException.forbidden("Invalid storage key");
        }
        return resolved;
    }
}
