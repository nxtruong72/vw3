package com.example.demo;

import com.example.demo.model.Report;
import com.example.demo.service.CsvService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.FileInputStream;
import java.util.List;

@SpringBootApplication
public class DemoApplication implements CommandLineRunner {
	@Autowired
	CsvService csvService;

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		File file = new File("C:\\Users\\Admin\\Downloads\\export.csv");
		List<Report> reports = csvService.convertFromInputStream(new FileInputStream(file));
		System.out.println("OK");
	}
}
