package com.vestry.Controller;

import com.vestry.Model.Outfit;
import com.vestry.Service.OutfitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/outfits")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    @GetMapping
    public ResponseEntity<List<Outfit>> list(@RequestParam Long userId) {
        return ResponseEntity.ok(outfitService.getByUser(userId));
    }

    @PostMapping
    public ResponseEntity<Outfit> create(
            @RequestParam Long userId,
            @RequestParam String name,
            @RequestParam(required = false) String occasion,
            @RequestParam String garmentIds,
            @RequestParam(required = false) MultipartFile thumbnail) throws IOException {
        return ResponseEntity.ok(outfitService.create(userId, name, occasion, garmentIds, thumbnail));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Outfit> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(outfitService.update(id, body.get("name"), body.get("occasion")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        outfitService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
