package com.guclogistics.shared.api;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PageResponseTest {

    @Test
    void fromMapsSpringPage() {
        Page<String> page = new PageImpl<>(
                List.of("a", "b"),
                PageRequest.of(1, 10),
                25
        );

        PageResponse<String> response = PageResponse.from(page);

        assertThat(response.content()).containsExactly("a", "b");
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(10);
        assertThat(response.totalElements()).isEqualTo(25);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.hasNext()).isTrue();
    }

    @Test
    void hasNextFalseOnLastPage() {
        Page<String> page = new PageImpl<>(List.of("z"), PageRequest.of(2, 10), 21);

        assertThat(PageResponse.from(page).hasNext()).isFalse();
    }
}
