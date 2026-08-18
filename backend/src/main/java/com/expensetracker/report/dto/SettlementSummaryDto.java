package com.expensetracker.report.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class SettlementSummaryDto {
    /** The user who owes money */
    private UUID fromUserId;
    private String fromUserName;
    /** The user who is owed money */
    private UUID toUserId;
    private String toUserName;
    /** Net amount owed */
    private BigDecimal netAmount;

    public SettlementSummaryDto() {}

    public SettlementSummaryDto(UUID fromUserId, String fromUserName,
                                 UUID toUserId, String toUserName,
                                 BigDecimal netAmount) {
        this.fromUserId = fromUserId;
        this.fromUserName = fromUserName;
        this.toUserId = toUserId;
        this.toUserName = toUserName;
        this.netAmount = netAmount;
    }

    public UUID getFromUserId() { return fromUserId; }
    public void setFromUserId(UUID fromUserId) { this.fromUserId = fromUserId; }
    public String getFromUserName() { return fromUserName; }
    public void setFromUserName(String fromUserName) { this.fromUserName = fromUserName; }
    public UUID getToUserId() { return toUserId; }
    public void setToUserId(UUID toUserId) { this.toUserId = toUserId; }
    public String getToUserName() { return toUserName; }
    public void setToUserName(String toUserName) { this.toUserName = toUserName; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
}
