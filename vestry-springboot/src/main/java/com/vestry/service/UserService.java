package com.vestry.Service;

import com.vestry.Dto.AuthResponse;
import com.vestry.Model.User;
import com.vestry.Repository.UserRepository;
import com.vestry.Security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse registerOrLogin(String name, String email, String password, MultipartFile avatar) throws IOException {
        if (password == null || password.isBlank()) {
            throw new RuntimeException("La contraseña es obligatoria");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            // Usuario existente: verificar contraseña
            if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                // Cuenta creada antes de que existieran contraseñas: establecerla ahora
                user.setPasswordHash(passwordEncoder.encode(password));
            } else if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                throw new RuntimeException("Contraseña incorrecta");
            }
        } else {
            // Usuario nuevo: registrar
            user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(password));
        }

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
