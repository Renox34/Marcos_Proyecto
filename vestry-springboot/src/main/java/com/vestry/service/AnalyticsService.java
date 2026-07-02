package com.vestry.Service;

import com.vestry.Model.Garment;
import com.vestry.Repository.GarmentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final GarmentRepository garmentRepository;

    public AnalyticsService(GarmentRepository garmentRepository) {
        this.garmentRepository = garmentRepository;
    }

    public Map<String, Object> getStats(Long userId) {
        List<Garment> garments = garmentRepository.findByUserId(userId);
        LocalDate cutoff = LocalDate.now().minusDays(60);

        Map<String, Long> byCategory = garments.stream()
                .collect(Collectors.groupingBy(
                        g -> g.getCategory() != null ? g.getCategory() : "otro",
                        Collectors.counting()));

        List<Garment> topWorn = garments.stream()
                .sorted(Comparator.comparingInt(Garment::getTimesWorn).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<Garment> dormant = garments.stream()
                .filter(g -> g.getLastWorn() == null || g.getLastWorn().isBefore(cutoff))
                .collect(Collectors.toList());

        List<String> colorPalette = garments.stream()
                .map(Garment::getColor)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("total", garments.size());
        result.put("byCategory", byCategory);
        result.put("topWorn", topWorn);
        result.put("dormant", dormant);
        result.put("colorPalette", colorPalette);
        result.put("saturated", garments.size() > 50);

        return result;
    }
}
