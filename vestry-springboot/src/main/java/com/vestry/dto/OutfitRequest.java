package com.vestry.dto;

import java.util.List;

public class OutfitRequest {
    private Long userId;
    private String name;
    private String occasion;
    private List<Long> garmentIds;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOccasion() { return occasion; }
    public void setOccasion(String occasion) { this.occasion = occasion; }
    public List<Long> getGarmentIds() { return garmentIds; }
    public void setGarmentIds(List<Long> garmentIds) { this.garmentIds = garmentIds; }
}
