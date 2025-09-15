package com.apiround.greenhub.dto;

import java.math.BigDecimal;

public class CompanyStats {
    private long totalOrders;
    private long completedDeliveries;
    private long pendingOrders;
    private BigDecimal rating;  // ✅ BigDecimal

    public CompanyStats() {}

    public CompanyStats(long totalOrders, long completedDeliveries, long pendingOrders, BigDecimal rating) {
        this.totalOrders = totalOrders;
        this.completedDeliveries = completedDeliveries;
        this.pendingOrders = pendingOrders;
        this.rating = rating;
    }

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getCompletedDeliveries() { return completedDeliveries; }
    public void setCompletedDeliveries(long completedDeliveries) { this.completedDeliveries = completedDeliveries; }

    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
}
