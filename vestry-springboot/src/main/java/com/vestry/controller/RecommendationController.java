package com.vestry.Controller;

import com.vestry.Model.PurchaseRecommendation;
import com.vestry.Service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<Map<String, String>> generate(@RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        List<String> styles = (List<String>) body.get("styles");
        return ResponseEntity.ok(Map.of("recommendations", recommendationService.generate(userId, styles)));
    }

    @PostMapping("/save")
    public ResponseEntity<PurchaseRecommendation> save(@RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        BigDecimal price = body.get("estimatedPrice") != null
                ? new BigDecimal(body.get("estimatedPrice").toString()) : null;
        return ResponseEntity.ok(recommendationService.save(
                userId,
                (String) body.get("itemName"),
                (String) body.get("styleCategory"),
                price,
                (String) body.get("buyLink"),
                (String) body.get("bestSeasonToBuy"),
                (String) body.get("reason")
        ));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<PurchaseRecommendation>> getSaved(@RequestParam Long userId) {
        return ResponseEntity.ok(recommendationService.getSaved(userId));
    }
}
