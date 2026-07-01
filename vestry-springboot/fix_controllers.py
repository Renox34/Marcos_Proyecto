import os

base = "F:/Proyecto Marcos/vestry-springboot/src/main/java/com/vestry"

controllers = {
    "controller/UserController.java": """package com.vestry.controller;

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
""",
    "controller/GarmentController.java": """package com.vestry.controller;

import com.vestry.model.Garment;
import com.vestry.service.GarmentService;
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
""",
    "controller/OutfitController.java": """package com.vestry.controller;

import com.vestry.model.Outfit;
import com.vestry.service.OutfitService;
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
""",
    "controller/CalendarController.java": """package com.vestry.controller;

import com.vestry.model.CalendarEntry;
import com.vestry.service.CalendarService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public ResponseEntity<List<CalendarEntry>> list(
            @RequestParam Long userId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(calendarService.getByMonth(userId, year, month));
    }

    @PostMapping
    public ResponseEntity<CalendarEntry> assign(@RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        Long outfitId = Long.parseLong(body.get("outfitId").toString());
        LocalDate date = LocalDate.parse(body.get("date").toString());
        String notes = (String) body.get("notes");
        return ResponseEntity.ok(calendarService.assign(userId, outfitId, date, notes));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        calendarService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
""",
    "controller/ChatController.java": """package com.vestry.controller;

import com.vestry.dto.ChatRequest;
import com.vestry.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequest req) {
        String response = chatService.chat(req.getUserId(), req.getMessage(), req.getHistory());
        return ResponseEntity.ok(Map.of("response", response));
    }
}
""",
    "controller/AnalyticsController.java": """package com.vestry.controller;

import com.vestry.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam Long userId) {
        return ResponseEntity.ok(analyticsService.getStats(userId));
    }
}
""",
    "controller/RecommendationController.java": """package com.vestry.controller;

import com.vestry.model.PurchaseRecommendation;
import com.vestry.service.RecommendationService;
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
        return recommendationService.getSaved(userId);
    }
}
""",
    "controller/CapsuleController.java": """package com.vestry.controller;

import com.vestry.service.CapsuleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/capsule")
public class CapsuleController {

    private final CapsuleService capsuleService;

    public CapsuleController(CapsuleService capsuleService) {
        this.capsuleService = capsuleService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> generate(@RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        return ResponseEntity.ok(Map.of("capsule", capsuleService.generate(userId)));
    }
}
""",
    "security/JwtUtil.java": """package com.vestry.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Long userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public Long extractUserId(String token) {
        String subject = Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return Long.parseLong(subject);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
""",
    "security/JwtFilter.java": """package com.vestry.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.validateToken(token)) {
                Long userId = jwtUtil.extractUserId(token);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
""",
    "config/SecurityConfig.java": """package com.vestry.config;

import com.vestry.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/users/register").permitAll()
                .requestMatchers("/", "/index.html", "/login.html", "/**/*.css",
                                 "/**/*.js", "/uploads/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
""",
    "config/GlobalExceptionHandler.java": """package com.vestry.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
    }
}
"""
}

for rel_path, content in controllers.items():
    path = base + "/" + rel_path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"OK: {rel_path.split('/')[-1]}")

print("Todos los archivos escritos correctamente.")
