package com.agence.voyage.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="supplier_profiles")
public class SupplierProfile {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @OneToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false,unique=true)
    @org.hibernate.annotations.OnDelete(action=org.hibernate.annotations.OnDeleteAction.CASCADE) public User user;
    @Column(length=160) public String companyName;
    @Column(length=20) public String contactPhone;
    @ManyToOne(fetch=FetchType.LAZY) public City city;
    @Column(length=500) public String address;
    @Column(length=2000) public String description;
    @Column(length=500) public String logoUrl;
    @Column(length=80) public String legalForm;
    @Column(length=80) public String registrationNumber;
    @Column(length=15) public String ice;
    @Column(length=80) public String taxId;
    @Column(length=2000) public String legalNotes;
    @Column(nullable=false) public LocalDateTime createdAt,updatedAt;
}
