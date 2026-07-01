package com.vestry.service;

import com.vestry.model.Garment;
import com.vestry.repository.GarmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CapsuleService {

    private final GarmentRepository garmentRepository;
    private final AnthropicService anthropicService;

    public CapsuleService(GarmentRepository garmentRepository, AnthropicService anthropicService) {
        this.garmentRepository = garmentRepository;
        this.anthropicService = anthropicService;
    }

    public String generate(Long userId) {
        List<Garment> garments = garmentRepository.findByUserId(userId);

        String wardrobeStr = garments.stream()
                .map(g -> "ID:" + g.getId() + " " + g.getName()
                        + " (" + g.getCategory() + ", " + g.getColor() + ")")
                .collect(Collectors.joining(", "));

        String prompt = "Armario: " + wardrobeStr
                + ". Selecciona 10-15 prendas para un armario capsula versatil."
                + " Responde en JSON: {selected_ids:[...], reasons:{id:razon}, total_outfits_possible:N}";

        return anthropicService.chat(
                "Eres experto en armarios capsula. Responde SOLO con JSON.",
                List.of(Map.of("role", "user", "content", prompt))
        );
    }
}
