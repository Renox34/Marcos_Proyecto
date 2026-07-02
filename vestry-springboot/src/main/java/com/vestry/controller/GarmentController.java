package com.vestry.Controller;

import com.vestry.Model.Garment;
import com.vestry.Service.GarmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/garments")
public class GarmentController {

    private final GarmentService garmentService;

    public GarmentController(GarmentService garmentService) {
        this.garmentService = garmentService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<String> analyze(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(garmentService.analyzeImage(body.get("image"), body.get("mediaType")));
    }

    @GetMapping
    public ResponseEntity<List<Garment>> list(@RequestParam Long userId) {
        return ResponseEntity.ok(garmentService.getByUser(userId));
    }

    @PostMapping
    public ResponseEntity<Garment> create(
            @RequestParam Long userId,
            @RequestParam String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal price,
            @RequestParam(required = false) MultipartFile image) throws IOException {
        return ResponseEntity.ok(garmentService.create(userId, name, category, color, brand, price, image));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Garment> update(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal price,
            @RequestParam(required = false) MultipartFile image) throws IOException {
        return ResponseEntity.ok(garmentService.update(id, name, category, color, brand, price, image));
    }

    @PatchMapping("/{id}/worn")
    public ResponseEntity<Void> recordWorn(@PathVariable Long id) {
        garmentService.recordWorn(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        garmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
