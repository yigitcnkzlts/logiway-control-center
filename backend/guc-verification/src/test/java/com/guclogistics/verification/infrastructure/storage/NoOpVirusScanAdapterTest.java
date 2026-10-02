package com.guclogistics.verification.infrastructure.storage;

import com.guclogistics.verification.application.port.VirusScanPort;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NoOpVirusScanAdapterTest {

    @Test
    void alwaysReturnsClean() {
        NoOpVirusScanAdapter adapter = new NoOpVirusScanAdapter();

        VirusScanPort.ScanResult result = adapter.scan("content".getBytes(), "file.pdf");

        assertThat(result.clean()).isTrue();
        assertThat(result.message()).isEqualTo("skipped");
    }
}
