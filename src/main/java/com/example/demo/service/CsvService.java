package com.example.demo.service;

import com.example.demo.model.Report;
import com.example.demo.model.ReportResponse;
import com.univocity.parsers.common.processor.BeanListProcessor;
import com.univocity.parsers.csv.CsvParser;
import com.univocity.parsers.csv.CsvParserSettings;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CsvService {
    public List<Report> convertFromInputStream(InputStream inputStream) throws FileNotFoundException {
        BeanListProcessor<Report> beanListProcessor = new BeanListProcessor<>(Report.class);
        CsvParserSettings parserSettings = new CsvParserSettings();
        CsvParser csvParser;

        parserSettings.setProcessor(beanListProcessor);
        parserSettings.setHeaderExtractionEnabled(true);
        parserSettings.setLineSeparatorDetectionEnabled(true);
        csvParser = new CsvParser(parserSettings);
        csvParser.parse(inputStream);

        return beanListProcessor.getBeans();
    }

    public Map<String, Long> analyzeReport(InputStream inputStream) throws FileNotFoundException {
        Map<String, Long> results = new HashMap<>();
        List<Report> reports = convertFromInputStream(inputStream);

        reports.stream().forEach(report -> {
            String bankerName = report.getBankerName().toUpperCase();
            if (!results.containsKey(bankerName)) {
                results.put(bankerName, report.getTurnover());
            } else {
                long tmp = results.get(bankerName);
                results.put(bankerName, tmp + report.getTurnover());
            }
        });

        return results;
    }
}
