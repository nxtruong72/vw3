package com.example.demo.controller;

import com.example.demo.model.ReportResponse;
import com.example.demo.service.CsvService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping(path = "/file")
public class FileController {
    @Autowired
    CsvService csvService;

    @RequestMapping(method = RequestMethod.POST, consumes = {"multipart/form-data"}, produces = "application/json")
    @ResponseBody
    public Map<String, Long> analyzeReport(@RequestPart("file") MultipartFile file) throws IOException {
        return csvService.analyzeReport(file.getInputStream());
    }
}
