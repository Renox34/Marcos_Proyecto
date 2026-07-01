package com.vestry.controller;

import com.vestry.dto.ChatRequest;
import com.vestry.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequest req) {
        String response = chatService.chat(req.getUserId(), req.getMessage(), req.getHistory());
        return ResponseEntity.ok(Map.of("response", response));
    }
}
