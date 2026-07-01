package com.vestry.service;

import com.vestry.model.Garment;
import com.vestry.model.User;
import com.vestry.repository.GarmentRepository;
import com.vestry.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class GarmentService {

    private final GarmentRepository garmentRepository;
    private final UserRepository userRepository;
    private final AnthropicService anthropicService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public GarmentService(GarmentRepository garmentRepository, UserRepository userRepository,
                          AnthropicService anthropicService) {
        this.garmentRepository = garmentRepository;
        this.userRepository = userRepository;
        this.anthropicService = anthropicService;
    }

    public String analyzeImage(String base64Image, String mediaType) {
        return anthropicService.analyzeGarmentImage(base64Image, mediaType);
    }

    public List<Garment> getByUser(Long userId) {
        return garmentRepository.findByUserId(userId);
    }

    public Garment create(Long userId, String name, String category, String color,
                          String brand, BigDecimal price, MultipartFile image) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Garment garment = new Garment();
        garment.setUser(user);
        garment.setName(name);
        garment.setCategory(category);
        garment.setColor(color);
        garment.setBrand(brand);
        garment.setPrice(price);

        if (image != null && !image.isEmpty()) {
            String filename = "garment_" + UUID.randomUUID() + getExt(image.getOriginalFilename());
            Path dest = Paths.get(uploadDir, filename);
            Files.createDirectories(dest.getParent());
            Files.copy(image.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            garment.setImageUrl("/uploads/" + filename);
        }

        return garmentRepository.save(garment);
    }

    public Garment update(Long id, String name, String category, String color,
                          String brand, BigDecimal price, MultipartFile image) throws IOException {
        Garment garment = garmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prenda no encontrada"));

        if (name != null) garment.setName(name);
        if (category != null) garment.setCategory(category);
        if (color != null) garment.setColor(color);
        if (brand != null) garment.setBrand(brand);
        if (price != null) garment.setPrice(price);

        if (image != null && !image.isEmpty()) {
            String filename = "garment_" + UUID.randomUUID() + getExt(image.getOriginalFilename());
            Path dest = Paths.get(uploadDir, filename);
            Files.createDirectories(dest.getParent());
            Files.copy(image.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            garment.setImageUrl("/uploads/" + filename);
        }

        return garmentRepository.save(garment);
    }

    public void recordWorn(Long id) {
        Garment garment = garmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prenda no encontrada"));
        garment.setTimesWorn(garment.getTimesWorn() + 1);
        garment.setLastWorn(LocalDate.now());
        garmentRepository.save(garment);
    }

    public void delete(Long id) {
        Garment garment = garmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prenda no encontrada"));
        deleteFile(garment.getImageUrl());
        garmentRepository.delete(garment);
    }

    private void deleteFile(String url) {
        if (url == null) return;
        try {
            String filename = url.replace("/uploads/", "");
            Files.deleteIfExists(Paths.get(uploadDir, filename));
        } catch (IOException ignored) {}
    }

    private String getExt(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}
