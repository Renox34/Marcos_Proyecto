package com.vestry.Dto;

import java.util.List;
import java.util.Map;

public class ChatRequest {
    private Long userId;
    private String message;
    private List<Map<String, String>> history;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<Map<String, String>> getHistory() { return history; }
    public void setHistory(List<Map<String, String>> history) { this.history = history; }
}
