package com.agence.voyage.foundation;

import com.agence.voyage.dto.PageResponse;
import com.agence.voyage.exception.*;
import com.agence.voyage.service.PaginationSupport;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class PaginationTest {
    public record Row(long id, String name) {
        public long getId() { return id; }
        public String getName() { return name; }
    }
    private final List<Row> rows = java.util.stream.LongStream.rangeClosed(1, 130)
            .mapToObj(i -> new Row(i, "row-" + i)).toList();
    @Test void clampsSizeAndPreservesTotals() {
        var result = PaginationSupport.paginate(rows, 0, PaginationSupport.size(999), "id,asc");
        assertEquals(100, result.getSize()); assertEquals(100, result.getContent().size());
        assertEquals(130, result.getTotalElements()); assertEquals(2, result.getTotalPages());
        assertTrue(result.isFirst()); assertFalse(result.isLast());
    }
    @Test void beyondLastIsEmptyWithoutOverflow() {
        var result = PaginationSupport.paginate(rows, Integer.MAX_VALUE, 100, "id,asc");
        assertTrue(result.getContent().isEmpty()); assertTrue(result.isLast());
        assertEquals(130, result.getTotalElements());
    }
    @Test void invalidSortIsRejectedEvenWithoutPagination() {
        for (String sort : List.of("password,asc", "id,delete", "id,asc,extra", "id;drop,asc")) {
            assertEquals(ErrorCode.BAD_REQUEST, assertThrows(BusinessException.class,
                    () -> PaginationSupport.list(rows, null, null, sort, Set.of("id","name"))).getCode());
        }
    }
    @Test void rawListAndSortedPageAreCompatible() {
        assertInstanceOf(List.class, PaginationSupport.list(rows, null, null, null, Set.of("id")));
        Object result = PaginationSupport.list(rows, 1, 20, "id,desc", Set.of("id"));
        assertInstanceOf(PageResponse.class, result);
        assertEquals(110L, ((Row)((PageResponse<?>) result).getContent().get(0)).id());
    }
}
