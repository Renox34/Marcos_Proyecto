package com.vestry.Service;

import com.vestry.Dto.AuthResponse;
import com.vestry.Model.User;
import com.vestry.Repository.UserRepository;
import com.vestry.Security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse registerOrLogin(String name, String email, MultipartFile avatar) throws IOException {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setName(name);
            u.setEmail(email);
            return u;
        });

        if (avatar != null && !avatar.isEmpty()) {
            String filename = "avatar_" + UUID.randomUUID() + getExt(avatar.getOriginalFilename());
            Path dest = Paths.get(uploadDir, filename);
            Files.createDirectories(dest.getParent());
            Files.copy(avatar.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            user.setAvatarUrl("/uploads/" + filename);
        }

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(user, token);
    }

    public User updateAvatar(Long id, MultipartFile avatar) throws IOException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String filename = "avatar_" + UUID.randomUUID() + getExt(avatar.getOriginalFilename());
        Path dest = Paths.get(uploadDir, filename);
        Files.createDirectories(dest.getParent());
        Files.copy(avatar.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        user.setAvatarUrl("/uploads/" + filename);

        return userRepository.save(user);
    }

    public User updateStyles(Long id, String styles) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setStylePreferences(styles);
        return userRepository.save(user);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private String getExt(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}
