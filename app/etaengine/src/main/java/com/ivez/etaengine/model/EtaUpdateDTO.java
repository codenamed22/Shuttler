package com.ivez.etaengine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtaUpdateDTO {
    private String busId;
    private Map<String, Long> etaPerStop;
}
