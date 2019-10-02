package com.example.demo.model;

import com.univocity.parsers.annotations.Parsed;
import lombok.Data;

@Data
public class Report {
    @Parsed(field = "banker_name")
    private String bankerName;

    @Parsed(field = "acc_name")
    private String accName;

    @Parsed(field = "report")
    private String report;

    @Parsed(field = "turnover")
    private Long turnover;

    @Parsed(field = "gross_comm")
    private Long grossComm;

    @Parsed(field = "net_turnover")
    private Long netTurnover;

    @Parsed(field = "turnoverTT")
    private Long turnoverTT;

    @Parsed(field = "payout")
    private Long payout;

    @Parsed(field = "master_total")
    private Long masterTotal;

    @Parsed(field = "member_comm")
    private Long memberComm;

    @Parsed(field = "win_loss")
    private Long winLoss;

    @Parsed(field = "company")
    private Long company;

    @Parsed(field = "ma_total")
    private Long maTotal;
}
