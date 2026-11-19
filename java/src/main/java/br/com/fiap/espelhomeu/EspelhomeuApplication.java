package br.com.fiap.espelhomeu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EspelhomeuApplication {

	public static void main(String[] args) {
		SpringApplication.run(EspelhomeuApplication.class, args);
	}

}
