package com.vestry.Controller;

import com.vestry.Service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
public class GeminiController {

    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/catalog-image")
    public ResponseEntity<Map<String, String>> catalogImage(@RequestBody Map<String, String> body) {
        String base64 = geminiService.generateCatalogImage(body.get("image"), body.get("mediaType"));
        return ResponseEntity.ok(Map.of("image", base64));
    }
}
