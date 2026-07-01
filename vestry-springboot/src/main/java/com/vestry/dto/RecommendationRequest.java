package com.vestry.dto;

import java.util.List;

public class RecommendationRequest {
    private Long userId;
    private List<String> styles;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<String> getStyles() { return styles; }
    public void setStyles(List<String> styles) { this.styles = styles; }
}
