package com.vestry.Service;

import com.vestry.Model.Outfit;
import com.vestry.Model.User;
import com.vestry.Repository.OutfitRepository;
import com.vestry.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class OutfitService {

    private final OutfitRepository outfitRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public OutfitService(OutfitRepository outfitRepository, UserRepository userRepository) {
        this.outfitRepository = outfitRepository;
        this.userRepository = userRepository;
    }

    public List<Outfit> getByUser(Long userId) {
        return outfitRepository.findByUserId(userId);
    }

    public Outfit create(Long userId, String name, String occasion,
                         String garmentIds, MultipartFile thumbnail) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Outfit outfit = new Outfit();
        outfit.setUser(user);
        outfit.setName(name);
        outfit.setOccasion(occasion);
        outfit.setGarmentIds(garmentIds);

        if (thumbnail != null && !thumbnail.isEmpty()) {
            String filename = "outfit_" + UUID.randomUUID() + ".png";
            Path dest = Paths.get(uploadDir, filename);
            Files.createDirectories(dest.getParent());
            Files.copy(thumbnail.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            outfit.setThumbnailUrl("/uploads/" + filename);
        }

        return outfitRepository.save(outfit);
    }

    public Outfit update(Long id, String name, String occasion) {
        Outfit outfit = outfitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outfit no encontrado"));
        if (name != null) outfit.setName(name);
        if (occasion != null) outfit.setOccasion(occasion);
        return outfitRepository.save(outfit);
    }

    public void delete(Long id) {
        outfitRepository.deleteById(id);
    }
}
