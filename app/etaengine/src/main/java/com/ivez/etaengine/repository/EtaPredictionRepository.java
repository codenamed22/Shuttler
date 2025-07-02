package com.ivez.etaengine.repository;

import com.ivez.etaengine.entity.EtaPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EtaPredictionRepository extends JpaRepository<EtaPrediction, Long> {

    List<EtaPrediction> findByBusIdAndStopIdAndDate(String busId, String stopId, LocalDate date);

    List<EtaPrediction> findByBusIdAndDate(String busId, LocalDate date);

}
