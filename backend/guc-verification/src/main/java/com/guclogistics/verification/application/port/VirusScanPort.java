package com.guclogistics.verification.application.port;

public interface VirusScanPort {

    ScanResult scan(byte[] content, String fileName);

    record ScanResult(boolean clean, String message) {
    }
}
