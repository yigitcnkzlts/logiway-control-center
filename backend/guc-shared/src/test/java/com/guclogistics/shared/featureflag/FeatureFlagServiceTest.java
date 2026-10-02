package com.guclogistics.shared.featureflag;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FeatureFlagServiceTest {

    @Test
    void isEnabledReturnsTrueWhenFlagEnabled() {
        Query query = mock(Query.class);
        when(query.setParameter(1, "mfa.required")).thenReturn(query);
        when(query.getResultStream()).thenReturn(Stream.of(Boolean.TRUE));

        EntityManager entityManager = entityManagerStub(query);
        FeatureFlagService service = new FeatureFlagService(entityManager);

        assertThat(service.isEnabled("mfa.required")).isTrue();
    }

    @Test
    void isEnabledReturnsFalseWhenFlagMissing() {
        Query query = mock(Query.class);
        when(query.setParameter(1, "unknown.flag")).thenReturn(query);
        when(query.getResultStream()).thenReturn(Stream.empty());

        EntityManager entityManager = entityManagerStub(query);
        FeatureFlagService service = new FeatureFlagService(entityManager);

        assertThat(service.isEnabled("unknown.flag")).isFalse();
    }

    private static EntityManager entityManagerStub(Query query) {
        return (EntityManager) Proxy.newProxyInstance(
                EntityManager.class.getClassLoader(),
                new Class[]{EntityManager.class},
                (proxy, method, args) -> {
                    if ("createNativeQuery".equals(method.getName()) && args.length == 1) {
                        return query;
                    }
                    Class<?> returnType = method.getReturnType();
                    if (returnType.equals(boolean.class)) {
                        return false;
                    }
                    if (returnType.equals(int.class)) {
                        return 0;
                    }
                    return null;
                });
    }
}
