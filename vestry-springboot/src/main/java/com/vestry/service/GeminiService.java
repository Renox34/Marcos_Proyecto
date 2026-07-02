package com.vestry.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String BASE_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String FLASH_MODEL   = "gemini-2.5-flash";
    private static final String IMG_GEN_MODEL = "gemini-2.0-flash-preview-image-generation";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public String preguntar(String prompt) {
        try {
            String body = mapper.writeValueAsString(Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(Map.of("text", prompt))
                ))
            ));
            return callGemini(FLASH_MODEL, body, false);
        } catch (Exception e) {
            throw new RuntimeException("Error Gemini text: " + e.getMessage(), e);
        }
    }

    public String analyzeGarmentImage(String base64Image, String mediaType) {
        try {
            String body = mapper.writeValueAsString(Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(
                        Map.of("text",
                            "Analiza esta prenda y responde SOLO en JSON con este formato exacto: " +
                            "{\"name\":\"...\",\"category\":\"top|bottom|dress|outerwear|shoes|accessory\",\"color\":\"...\"}"),
                        Map.of("inlineData", Map.of("mimeType", mediaType, "data", base64Image))
                    )
                ))
            ));
            return callGemini(FLASH_MODEL, body, false);
        } catch (Exception e) {
            throw new RuntimeException("Error analizando imagen: " + e.getMessage(), e);
        }
    }

    public String generateCatalogImage(String base64Image, String mediaType) {
        try {
            String body = mapper.writeValueAsString(Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(
                        Map.of("text",
                            "Transform this clothing photo into a professional fashion catalog image. " +
                            "Requirements: pure white background, centered garment, studio lighting, " +
                            "no model, no mannequin, no shadows on background, high quality, " +
                            "clean minimalist presentation like a premium e-commerce product photo."),
                        Map.of("inlineData", Map.of("mimeType", mediaType, "data", base64Image))
                    )
                )),
                "generationConfig", Map.of(
                    "responseModalities", List.of("IMAGE", "TEXT")
                )
            ));
            return callGemini(IMG_GEN_MODEL, body, true);
        } catch (Exception e) {
            throw new RuntimeException("Error generando imagen catalogo: " + e.getMessage(), e);
        }
    }

    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        StringBuilder prompt = new StringBuilder(systemPrompt);
        prompt.append("\n\nConversacion:\n");
        for (Map<String, String> m : messages) {
            prompt.append(m.get("role")).append(": ").append(m.get("content")).append("\n");
        }
        return preguntar(prompt.toString());
    }

    private String callGemini(String model, String body, boolean returnImage) {
        try {
            String url = BASE_URL + model + ":generateContent?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            JsonNode root = mapper.readTree(response.getBody());
            JsonNode parts = root.path("candidates").get(0).path("content").path("parts");

            if (returnImage) {
                for (JsonNode part : parts) {
                    if (part.has("inlineData")) {
                        return part.path("inlineData").path("data").asText();
                    }
                }
                throw new RuntimeException("Gemini no devolvio imagen");
            }
            return parts.get(0).path("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Error llamando Gemini: " + e.getMessage(), e);
        }
    }
}
