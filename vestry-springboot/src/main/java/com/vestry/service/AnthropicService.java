package com.vestry.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AnthropicService {

    @Value("${app.anthropic.api-key}")
    private String apiKey;

    @Value("${app.anthropic.model}")
    private String model;

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public String analyzeGarmentImage(String base64Image, String mediaType) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", model);
            body.put("max_tokens", 300);

            ArrayNode messages = body.putArray("messages");
            ObjectNode msg = messages.addObject();
            msg.put("role", "user");

            ArrayNode content = msg.putArray("content");
            ObjectNode imgNode = content.addObject();
            imgNode.put("type", "image");
            ObjectNode src = imgNode.putObject("source");
            src.put("type", "base64");
            src.put("media_type", mediaType);
            src.put("data", base64Image);

            ObjectNode textNode = content.addObject();
            textNode.put("type", "text");
            textNode.put("text", "Analiza esta prenda de ropa y responde en JSON: {\"name\": \"nombre descriptivo\", \"category\": \"top|bottom|dress|outerwear|shoes|accessory\", \"color\": \"color principal en español\"}");

            return callApi(body.toString());
        } catch (Exception e) {
            throw new RuntimeException("Error al analizar imagen: " + e.getMessage());
        }
    }

    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", model);
            body.put("max_tokens", 1024);
            body.put("system", systemPrompt);

            ArrayNode msgs = body.putArray("messages");
            for (Map<String, String> m : messages) {
                ObjectNode node = msgs.addObject();
                node.put("role", m.get("role"));
                node.put("content", m.get("content"));
            }

            return callApi(body.toString());
        } catch (Exception e) {
            throw new RuntimeException("Error en chat: " + e.getMessage());
        }
    }

    private String callApi(String bodyJson) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        HttpEntity<String> entity = new HttpEntity<>(bodyJson, headers);
        ResponseEntity<String> response = restTemplate.exchange(API_URL, HttpMethod.POST, entity, String.class);

        JsonNode root = mapper.readTree(response.getBody());
        return root.path("content").get(0).path("text").asText();
    }
}
