package com.agence.voyage.dto;

import java.util.List;

/** Contrat stable commun à toutes les listes paginées. */
public class PageResponse<T> {
    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final String sort;
    public PageResponse(List<T> content, int page, int size, long totalElements, String sort) {
        this.content = List.copyOf(content);
        this.page = page; this.size = size; this.totalElements = totalElements;
        this.totalPages = (int) ((totalElements + size - 1) / size);
        this.sort = sort;
    }
    public List<T> getContent() { return content; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
    public boolean isFirst() { return page == 0; }
    public boolean isLast() { return totalPages == 0 || page >= totalPages - 1; }
    public String getSort() { return sort; }
}
