package com.guclogistics.users.api;

import com.guclogistics.shared.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserProfileControllerUnitTest {

    private final UserProfileController controller = new UserProfileController();

    @Test
    void meReturnsAuthenticatedUserProfile() {
        AuthenticatedUser user = new AuthenticatedUser(
                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                UUID.randomUUID(),
                "user@example.com",
                Set.of("SHIPPER"),
                true);

        Map<String, Object> result = controller.me(user);

        assertThat(result.get("email")).isEqualTo("user@example.com");
        assertThat(result.get("roles")).isEqualTo(Set.of("SHIPPER"));
        assertThat(result.get("mfaVerified")).isEqualTo(true);
    }

    @Test
    void adminPingRequiresAdminRoleMetadataPresent() throws Exception {
        Method method = UserProfileController.class.getMethod("adminPing");
        var annotation = method.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).contains("ADMIN");
    }
}
