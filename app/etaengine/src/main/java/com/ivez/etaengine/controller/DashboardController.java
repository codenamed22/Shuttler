package com.ivez.etaengine.controller;

import com.ivez.etaengine.dto.StopEtaResponse;
import com.ivez.etaengine.service.Dashboard;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final Dashboard dashboard;

    public DashboardController(Dashboard dashboard){
        this.dashboard = dashboard;
    }

    @GetMapping("/bus/{busId}/date/{date}")
    public List<StopEtaResponse> getStopArrivalsAndEtas(
            @PathVariable String busId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return dashboard.getDashboardData(busId, date);
    }

}
