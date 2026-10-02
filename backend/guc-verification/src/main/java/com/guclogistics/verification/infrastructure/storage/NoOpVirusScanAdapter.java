package com.guclogistics.verification.infrastructure.storage;

import com.guclogistics.verification.application.port.VirusScanPort;
import org.springframework.stereotype.Component;

@Component
public class NoOpVirusScanAdapter implements VirusScanPort {

    @Override
    public ScanResult scan(byte[] content, String fileName) {
        return new ScanResult(true, "skipped");
    }
}
