package com.ivez.etaengine.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "eta_predictions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtaPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bus_id", nullable = false)
    private String busId;

    @Column(name = "stop_id", nullable = false)
    private String stopId;

    @Column(name = "stop_name")
    private String stopName;

    @Column(name = "predicted_arrival_time", nullable = false)
    private LocalDateTime predictedArrivalTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.date = this.predictedArrivalTime.toLocalDate(); // derive from prediction
    }
}
