package com.vestry.Controller;

import com.vestry.Dto.ChatRequest;
import com.vestry.Service.ChatService;
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

   /* @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequest req) {
        String response = chatService.chat(req.getUserId(), req.getMessage(), req.getHistory());
return ResponseEntity.ok(Map.of("reply", response));       
// return ResponseEntity.ok(Map.of("response", response));
    }
*/
    @PostMapping
public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequest req) {

    String reply = chatService.chat(
            req.getUserId(),
            req.getMessage(),
            req.getHistory()
    );

    return ResponseEntity.ok(Map.of("reply", reply));
}
}
