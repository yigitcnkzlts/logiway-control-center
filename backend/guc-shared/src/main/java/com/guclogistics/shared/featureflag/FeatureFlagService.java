package com.guclogistics.shared.featureflag;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeatureFlagService {

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public boolean isEnabled(String key) {
        Object result = entityManager.createNativeQuery("""
                        SELECT enabled FROM feature_flags WHERE flag_key = ?
                        """)
                .setParameter(1, key)
                .getResultStream()
                .findFirst()
                .orElse(false);
        return Boolean.TRUE.equals(result);
    }
}
