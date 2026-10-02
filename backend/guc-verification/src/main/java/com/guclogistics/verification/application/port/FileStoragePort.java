package com.guclogistics.verification.application.port;

import java.io.InputStream;

public interface FileStoragePort {

    String store(String relativeKey, InputStream content, long sizeBytes, String mimeType);

    InputStream read(String storageKey);
}
