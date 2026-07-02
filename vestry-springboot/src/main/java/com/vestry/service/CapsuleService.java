package com.vestry.Service;

import com.vestry.Model.Garment;
import com.vestry.Repository.GarmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CapsuleService {

    private final GarmentRepository garmentRepository;
    private final GeminiService geminiService;
//private final AnthropicService anthropicService;

    public CapsuleService(GarmentRepository garmentRepository, GeminiService geminiService) {
        this.garmentRepository = garmentRepository;
        this.geminiService = geminiService;
        
//this.anthropicService = anthropicService;
    }

    public String generate(Long userId) {

        List<Garment> garments = garmentRepository.findByUserId(userId);

        String wardrobeStr = garments.stream()
                .map(g -> "ID:" + g.getId() + " "
                        + g.getName()
                        + " (" + g.getCategory()
                        + ", " + g.getColor() + ")")
                .collect(Collectors.joining(", "));

        String prompt = """
Eres un experto en moda y armarios cápsula.

Este es el armario del usuario:

%s

Selecciona entre 10 y 15 prendas que formarían el mejor armario cápsula.

Si el armario está vacío, recomienda las prendas ideales para comenzar uno.

Explica brevemente por qué elegiste cada prenda.
"""
        .formatted(wardrobeStr);

        return geminiService.preguntar(prompt);
    }
}