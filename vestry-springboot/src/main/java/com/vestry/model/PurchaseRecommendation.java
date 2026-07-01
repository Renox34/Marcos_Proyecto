package com.vestry.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_recommendations")
public class PurchaseRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "style_category")
    private String styleCategory;

    @Column(name = "estimated_price")
    private BigDecimal estimatedPrice;

    @Column(name = "buy_link")
    private String buyLink;

    @Column(name = "best_season_to_buy")
    private String bestSeasonToBuy;

    private String reason;

    @Column(name = "saved_at")
    private LocalDateTime savedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getStyleCategory() { return styleCategory; }
    public void setStyleCategory(String styleCategory) { this.styleCategory = styleCategory; }
    public BigDecimal getEstimatedPrice() { return estimatedPrice; }
    public void setEstimatedPrice(BigDecimal estimatedPrice) { this.estimatedPrice = estimatedPrice; }
    public String getBuyLink() { return buyLink; }
    public void setBuyLink(String buyLink) { this.buyLink = buyLink; }
    public String getBestSeasonToBuy() { return bestSeasonToBuy; }
    public void setBestSeasonToBuy(String bestSeasonToBuy) { this.bestSeasonToBuy = bestSeasonToBuy; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getSavedAt() { return savedAt; }
    public void setSavedAt(LocalDateTime savedAt) { this.savedAt = savedAt; }
}
