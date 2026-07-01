package com.vestry.service;

import com.vestry.model.Garment;
import com.vestry.repository.GarmentRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final GarmentRepository garmentRepository;
    private final AnthropicService anthropicService;

    public ChatService(GarmentRepository garmentRepository, AnthropicService anthropicService) {
        this.garmentRepository = garmentRepository;
        this.anthropicService = anthropicService;
    }

    public String chat(Long userId, String message, List<Map<String, String>> history) {
        List<Garment> garments = garmentRepository.findByUserId(userId);

        String wardrobeContext = garments.stream()
                .map(g -> g.getId() + " | " + g.getName() + " | " + g.getCategory()
                        + " | " + g.getColor() + " | " + (g.getBrand() != null ? g.getBrand() : ""))
                .collect(Collectors.joining(", "));

        String systemPrompt = "Eres VERA, asistente de moda personal. "
                + "Armario: " + wardrobeContext
                + ". Cuando sugieras outfits incluye al final un JSON con los IDs.";

        List<Map<String, String>> messages = new ArrayList<>(history != null ? history : List.of());
        messages.add(Map.of("role", "user", "content", message));

        if (messages.size() > 10) {
            messages = messages.subList(messages.size() - 10, messages.size());
        }

        return anthropicService.chat(systemPrompt, messages);
    }
}
