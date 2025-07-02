package com.ivez.etaengine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StopEtaResponse {

    private String busId;
    private String stopId;
    private String stopName;
    private LocalDateTime actualArrival;
    private LocalDateTime eta5minBefore;
    private LocalDateTime eta3minBefore;
    private LocalDateTime eta2minBefore;

}
