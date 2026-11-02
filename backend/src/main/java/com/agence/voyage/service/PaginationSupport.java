package com.agence.voyage.service;

import com.agence.voyage.dto.PageResponse;
import com.agence.voyage.exception.*;
import org.springframework.beans.BeanWrapperImpl;
import java.util.*;

/** Adaptateur de compatibilité : tableau brut sans page/size, enveloppe sinon.
 * Les filtres métiers existants restent appliqués avant pagination.
 */
public final class PaginationSupport {
    private PaginationSupport() {}
    public static int size(Integer value) { return value == null ? 20 : Math.min(100, Math.max(1, value)); }
    public static int page(Integer value) { return value == null ? 0 : Math.max(0, value); }
    public static String sort(String value, Set<String> allowed) {
        String normalized = value == null || value.isBlank() ? "id,asc" : value;
        String[] parts = normalized.split(",", -1);
        if (parts.length != 2 || !allowed.contains(parts[0]) || !Set.of("asc", "desc").contains(parts[1])) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tri invalide ; champs autorisés : " + String.join(", ", new TreeSet<>(allowed)));
        }
        return normalized;
    }
    @SuppressWarnings({"unchecked", "rawtypes"})
    public static <T> Comparator<T> comparator(String sort) {
        String[] parts = sort.split(",");
        Comparator<T> comparator = Comparator.comparing(
                value -> (Comparable) new BeanWrapperImpl(value).getPropertyValue(parts[0]),
                Comparator.nullsLast(Comparator.naturalOrder()));
        if ("desc".equals(parts[1])) comparator = comparator.reversed();
        return comparator;
    }
    public static <T> Object list(List<T> values, Integer page, Integer size, String sort, Set<String> allowed) {
        if (page == null && size == null && sort == null) return values;
        String normalized = sort(sort, allowed);
        List<T> sorted = values.stream().sorted(comparator(normalized)).toList();
        if (page == null && size == null) return sorted;
        return paginate(sorted, page(page), size(size), normalized);
    }
    public static <T> PageResponse<T> paginate(List<T> sorted, int page, int size, String sort) {
        int from = (int) Math.min((long) page * size, sorted.size());
        int to = Math.min(from + size, sorted.size());
        return new PageResponse<>(sorted.subList(from, to), page, size, sorted.size(), sort);
    }
    public static String offerSort(String value) {
        String normalized = switch (value == null ? "" : value) {
            case "", "recent" -> "id,desc";
            case "price_asc" -> "basePrice,asc";
            case "price_desc" -> "basePrice,desc";
            case "rating", "rating_desc" -> "averageRating,desc";
            case "rating_asc" -> "averageRating,asc";
            default -> value;
        };
        return sort(normalized, Set.of("id", "title", "basePrice", "averageRating", "reviewCount"));
    }
}
