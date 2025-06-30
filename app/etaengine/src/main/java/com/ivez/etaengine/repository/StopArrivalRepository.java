package com.ivez.etaengine.repository;

import com.ivez.etaengine.entity.StopArrival;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StopArrivalRepository extends JpaRepository<StopArrival, Long> {

    List<StopArrival> findByBusIdAndDate(String busId, LocalDate date);

    StopArrival findByBusIdAndStopIdAndDate(String busId, String stopId, LocalDate date);

}
