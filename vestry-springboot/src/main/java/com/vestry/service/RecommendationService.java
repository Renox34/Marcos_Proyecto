package com.vestry.service;

import com.vestry.model.Garment;
import com.vestry.model.PurchaseRecommendation;
import com.vestry.model.User;
import com.vestry.repository.GarmentRepository;
import com.vestry.repository.PurchaseRecommendationRepository;
import com.vestry.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final GarmentRepository garmentRepository;
    private final PurchaseRecommendationRepository recRepository;
    private final UserRepository userRepository;
    private final AnthropicService anthropicService;

    public RecommendationService(GarmentRepository garmentRepository,
                                 PurchaseRecommendationRepository recRepository,
                                 UserRepository userRepository,
                                 AnthropicService anthropicService) {
        this.garmentRepository = garmentRepository;
        this.recRepository = recRepository;
        this.userRepository = userRepository;
        this.anthropicService = anthropicService;
    }

    public String generate(Long userId, List<String> styles) {
        List<Garment> garments = garmentRepository.findByUserId(userId);

        String wardrobeStr = garments.stream()
                .map(g -> g.getName() + " (" + g.getCategory() + ", " + g.getColor() + ")")
                .collect(Collectors.joining(", "));

        String prompt = "Basandote en el armario: " + wardrobeStr
                + ". Estilos: " + String.join(", ", styles)
                + ". Sugiere 6 prendas en JSON array:"
                + " [{name,category,price,season,reason,buyLink}]";

        return anthropicService.chat(
                "Eres un asesor de moda experto. Responde SOLO con JSON valido.",
                List.of(Map.of("role", "user", "content", prompt))
        );
    }

    public PurchaseRecommendation save(Long userId, String itemName, String styleCategory,
                                       BigDecimal price, String buyLink, String season, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        PurchaseRecommendation rec = new PurchaseRecommendation();
        rec.setUser(user);
        rec.setItemName(itemName);
        rec.setStyleCategory(styleCategory);
        rec.setEstimatedPrice(price);
        rec.setBuyLink(buyLink);
        rec.setBestSeasonToBuy(season);
        rec.setReason(reason);

        return recRepository.save(rec);
    }

    public List<PurchaseRecommendation> getSaved(Long userId) {
        return recRepository.findByUserId(userId);
    }
}
