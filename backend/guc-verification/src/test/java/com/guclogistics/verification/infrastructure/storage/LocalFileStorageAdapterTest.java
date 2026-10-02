package com.guclogistics.verification.infrastructure.storage;

import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.verification.application.port.VirusScanPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalFileStorageAdapterTest {

    @TempDir
    Path tempDir;

    @Test
    void storeAndReadRoundTrip() throws Exception {
        LocalFileStorageAdapter adapter = new LocalFileStorageAdapter(tempDir.toString());
        byte[] content = "hello pdf".getBytes();

        adapter.store("verification/app/doc.pdf", new ByteArrayInputStream(content), content.length, "application/pdf");

        try (InputStream in = adapter.read("verification/app/doc.pdf")) {
            assertThat(in.readAllBytes()).isEqualTo(content);
        }
    }

    @Test
    void readMissingFileNotFound() {
        LocalFileStorageAdapter adapter = new LocalFileStorageAdapter(tempDir.toString());

        assertThatThrownBy(() -> adapter.read("missing/file.pdf"))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void invalidStorageKeyForbidden() {
        LocalFileStorageAdapter adapter = new LocalFileStorageAdapter(tempDir.toString());

        assertThatThrownBy(() -> adapter.store("../escape.txt", new ByteArrayInputStream(new byte[0]), 0, "text/plain"))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Invalid storage key");
    }
}
