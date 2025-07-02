package com.ivez.etaengine.controller;

import com.ivez.etaengine.dto.StopEtaResponse;
import com.ivez.etaengine.service.BusStateTracker;
import com.ivez.etaengine.service.Dashboard;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final Dashboard dashboard;
    private final BusStateTracker stateTracker;

    public DashboardController(Dashboard dashboard, BusStateTracker stateTracker){
        this.dashboard = dashboard;
        this.stateTracker = stateTracker;
    }

    @GetMapping("/bus/{busId}/date/{date}")
    public List<StopEtaResponse> getStopArrivalsAndEtas(
            @PathVariable String busId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return dashboard.getDashboardData(busId, date);
    }

    @GetMapping(path = "/buses")
    public List<String> getBuses(){
        return stateTracker.getAllStates().keySet().stream().toList();
    }


}
