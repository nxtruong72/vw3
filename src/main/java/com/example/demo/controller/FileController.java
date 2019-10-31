package com.example.demo.controller;

import com.example.demo.service.CsvService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping(path = "/file")
public class FileController {
//    private static String FILE_NAME = "D:\\project\\spring-group\\gui\\temp-message.json";
//    private static String FILE_SCAN_NAME = "D:\\project\\spring-group\\gui\\scan.json";
    private static String FILE_NAME = "/home/nxuantruong/Source/vw3/vw3/gui/temp-message.json";
    private static String FILE_SCAN_NAME_SB = "/home/nxuantruong/Source/vw3/vw3/gui/scan.json";
    private static String FILE_SCAN_NAME_GA = "/home/nxuantruong/Source/vw3/vw3/gui/scan_ga.json";
    private static String FILE_SCAN_NAME_LOTO = "/home/nxuantruong/Source/vw3/vw3/gui/scan_loto.json";
    private static String FILE_MEMBER = "/home/nxuantruong/Source/vw3/vw3/gui/member.json";
    private static String FILE_MEMBER_CHILDREN = "/home/nxuantruong/Source/vw3/vw3/gui/member_children.json";
    private static String FILE_ACCOUNT = "/home/nxuantruong/Source/vw3/vw3/gui/account.json";

    @Autowired
    CsvService csvService;

    @RequestMapping(method = RequestMethod.POST, consumes = {"multipart/form-data"}, produces = "application/json")
    @ResponseBody
    public Map<String, Long> analyzeReport(@RequestPart("file") MultipartFile file) throws IOException {
        return csvService.analyzeReport(file.getInputStream());
    }

    @GetMapping(path = "/test", produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getText() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(FILE_NAME), StandardCharsets.UTF_8);
        return String.join(System.lineSeparator(), lines);
    }

    @GetMapping(path = "/detail")
    @ResponseBody
    public String getDetailSb() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(FILE_SCAN_NAME_SB), StandardCharsets.UTF_8);
        return String.join(System.lineSeparator(), lines);
    }

    @GetMapping(path = "/detail_ga")
    @ResponseBody
    public String getDetailGa() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(FILE_SCAN_NAME_GA), StandardCharsets.UTF_8);
        return String.join(System.lineSeparator(), lines);
    }

    @GetMapping(path = "/detail_loto")
    @ResponseBody
    public String getDetailLoto() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(FILE_SCAN_NAME_LOTO), StandardCharsets.UTF_8);
        return String.join(System.lineSeparator(), lines);
    }

    @GetMapping(path = "/member", produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getMember() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(FILE_MEMBER), StandardCharsets.UTF_8);
        return String.join(System.lineSeparator(), lines);
    }

    @GetMapping(path = "/member_children", produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getMemberChildren() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(FILE_MEMBER_CHILDREN), StandardCharsets.UTF_8);
        return String.join(System.lineSeparator(), lines);
    }

    @GetMapping(path = "/account", produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getAccout() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(FILE_ACCOUNT), StandardCharsets.UTF_8);
        return String.join(System.lineSeparator(), lines);
    }
}
