package com.vestry.controller;

import com.vestry.dto.AuthResponse;
import com.vestry.model.User;
import com.vestry.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam(required = false) MultipartFile avatar) throws IOException {
        return ResponseEntity.ok(userService.registerOrLogin(name, email, avatar));
    }

    @PatchMapping("/{id}/avatar")
    public ResponseEntity<User> updateAvatar(
            @PathVariable Long id,
            @RequestParam MultipartFile avatar) throws IOException {
        return ResponseEntity.ok(userService.updateAvatar(id, avatar));
    }

    @PatchMapping("/{id}/styles")
    public ResponseEntity<User> updateStyles(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.updateStyles(id, body.get("styles")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }
}
