package com.agence.voyage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name="booking_sequence")
public class BookingSequence {
    @Id @Column(name="sequence_year")
    private Integer year;
    @Column(nullable=false)
    private Long lastValue = 0L;
    public Integer getYear() { return year; }
    public void setYear(Integer value) { this.year = value; }
    public Long getLastValue() { return lastValue; }
    public void setLastValue(Long value) { this.lastValue = value; }

}

