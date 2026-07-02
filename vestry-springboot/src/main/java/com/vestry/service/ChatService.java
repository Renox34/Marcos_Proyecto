package com.vestry.Service;

import com.vestry.Model.Garment;
import com.vestry.Repository.GarmentRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final GarmentRepository garmentRepository;
    private final GeminiService geminiService;

    public ChatService(GarmentRepository garmentRepository, GeminiService geminiService) {
        this.garmentRepository = garmentRepository;
        this.geminiService = geminiService;
    }

    public String chat(Long userId, String message, List<Map<String, String>> history) {

        List<Garment> garments = garmentRepository.findByUserId(userId);

        String wardrobeContext = garments.isEmpty()
            ? "El usuario no tiene prendas registradas aun."
            : garments.stream()
                .map(g -> g.getId() + " | " + g.getName() + " | " + g.getCategory()
                        + " | " + g.getColor() + " | " + (g.getBrand() != null ? g.getBrand() : "Sin marca"))
                .collect(Collectors.joining("\n"));

        String systemPrompt =
            "Eres VERA, asesora profesional de moda con personalidad elegante y cercana. El usuario vive en Ecuador.\n\n" +
            "ARMARIO DEL USUARIO:\n" + wardrobeContext + "\n\n" +
            "REGLAS:\n" +
            "- Usa prendas del armario si las hay. Completa con compras solo si faltan piezas clave.\n" +
            "- Recomienda tiendas de Ecuador: De Prati (deprati.com.ec), EtaFashion (etafashion.com), " +
            "RM (rm.com.ec), Zara (zara.com), H&M (hm.com), Nike (nike.com), Adidas (adidas.com), Puma (puma.com).\n" +
            "- Precios en USD realistas para Ecuador.\n" +
            "- Explica por que combinan los colores y estilos.\n" +
            "- Usa emojis con moderacion para hacer la respuesta mas visual.\n\n" +
            "FORMATO OBLIGATORIO:\n" +
            "Escribe tu respuesta normalmente. Al final SIEMPRE agrega un bloque JSON entre estas marcas exactas:\n" +
            "===JSON_START===\n" +
            "... aqui el JSON ...\n" +
            "===JSON_END===\n\n" +
            "Si recomendaste un outfit o productos para comprar, el JSON debe tener esta estructura:\n" +
            "{\"type\":\"recommendation\",\"outfit_name\":\"nombre del look\",\"items\":[" +
            "{\"category\":\"top\",\"emoji\":\"👔\",\"name\":\"nombre prenda\",\"store\":\"De Prati\"," +
            "\"store_domain\":\"deprati.com.ec\",\"price_usd\":18.99," +
            "\"buy_url\":\"https://www.deprati.com.ec\",\"wardrobe_id\":null,\"color\":\"blanco\"}]," +
            "\"total_usd\":18.99,\"suggested_garment_ids\":[]}\n\n" +
            "- wardrobe_id: pon el ID de la prenda si viene del armario; null si hay que comprarla.\n" +
            "- suggested_garment_ids: lista de IDs de prendas del armario usadas en el outfit.\n" +
            "- Si el usuario solo hace una pregunta general sin pedir outfit ni productos, usa:\n" +
            "{\"type\":\"none\",\"suggested_garment_ids\":[]}";

        List<Map<String, String>> messages = new ArrayList<>();
        if (history != null && !history.isEmpty()) {
            int start = Math.max(0, history.size() - 10);
            messages.addAll(history.subList(start, history.size()));
        }
        messages.add(Map.of("role", "user", "content", message));

        return geminiService.chat(systemPrompt, messages);
    }
}
