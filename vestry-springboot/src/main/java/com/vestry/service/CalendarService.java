package com.vestry.Service;

import com.vestry.Model.CalendarEntry;
import com.vestry.Model.Outfit;
import com.vestry.Model.User;
import com.vestry.Repository.CalendarEntryRepository;
import com.vestry.Repository.GarmentRepository;
import com.vestry.Repository.OutfitRepository;
import com.vestry.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
public class CalendarService {

    private final CalendarEntryRepository calendarEntryRepository;
    private final UserRepository userRepository;
    private final OutfitRepository outfitRepository;
    private final GarmentRepository garmentRepository;

    public CalendarService(CalendarEntryRepository calendarEntryRepository,
                           UserRepository userRepository,
                           OutfitRepository outfitRepository,
                           GarmentRepository garmentRepository) {
        this.calendarEntryRepository = calendarEntryRepository;
        this.userRepository = userRepository;
        this.outfitRepository = outfitRepository;
        this.garmentRepository = garmentRepository;
    }

    public List<CalendarEntry> getByMonth(Long userId, int year, int month) {
        return calendarEntryRepository.findByUserAndMonth(userId, year, month);
    }

    public CalendarEntry assign(Long userId, Long outfitId, LocalDate date, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Outfit outfit = outfitRepository.findById(outfitId)
                .orElseThrow(() -> new RuntimeException("Outfit no encontrado"));

        CalendarEntry entry = calendarEntryRepository
                .findByUserIdAndDate(userId, date)
                .orElse(new CalendarEntry());

        entry.setUser(user);
        entry.setOutfit(outfit);
        entry.setDate(date);
        entry.setNotes(notes);

        CalendarEntry saved = calendarEntryRepository.save(entry);

        if (outfit.getGarmentIds() != null) {
            String ids = outfit.getGarmentIds().replaceAll("[\\[\\]\\s]", "");
            Arrays.stream(ids.split(","))
                    .filter(s -> !s.isBlank())
                    .map(Long::parseLong)
                    .forEach(gid -> garmentRepository.findById(gid).ifPresent(g -> {
                        g.setTimesWorn(g.getTimesWorn() + 1);
                        g.setLastWorn(date);
                        garmentRepository.save(g);
                    }));
        }

        return saved;
    }

    public void delete(Long id) {
        calendarEntryRepository.deleteById(id);
    }
}
