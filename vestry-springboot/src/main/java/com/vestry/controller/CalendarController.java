package com.vestry.Controller;

import com.vestry.Model.CalendarEntry;
import com.vestry.Service.CalendarService;
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
