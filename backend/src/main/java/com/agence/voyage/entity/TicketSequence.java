package com.agence.voyage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ticket_sequence")
public class TicketSequence {

    @Id
    @Column(name = "sequence_year")
    private Integer year;

    @Column(name = "last_value", nullable = false)
    private Long lastValue = 0L;

    public TicketSequence() {
    }

    public TicketSequence(Integer year, Long lastValue) {
        this.year = year;
        this.lastValue = lastValue;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Long getLastValue() {
        return lastValue;
    }

    public void setLastValue(Long lastValue) {
        this.lastValue = lastValue;
    }
}

