package com.ivez.etaengine.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stop_arrivals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StopArrival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bus_id", nullable = false)
    private String busId;
    @Column(name = "stop_id", nullable = false)
    private String stopId;
    @Column(name = "stop_name")
    private String stopName;
    @Column(name = "arrival_time", nullable = false)
    private LocalDateTime arrivalTime;
    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.date = this.arrivalTime.toLocalDate(); // derive from arrival
    }
}
