package com.ivez.etaengine;

import com.ivez.etaengine.service.GPSListener;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import javax.annotation.PostConstruct;

@SpringBootApplication
public class EtaengineApplication {

	private final GPSListener gpsListener;

	public EtaengineApplication(GPSListener gpsListener) {
		this.gpsListener = gpsListener;
	}

	public static void main(String[] args) {
		SpringApplication.run(EtaengineApplication.class, args);
	}

	@PostConstruct
	public void init() {
		gpsListener.connect();
	}
}