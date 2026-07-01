package com.vestry.repository;

import com.vestry.model.CalendarEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface CalendarEntryRepository extends JpaRepository<CalendarEntry, Long> {

    @Query("SELECT c FROM CalendarEntry c WHERE c.user.id = :userId " +
           "AND YEAR(c.date) = :year AND MONTH(c.date) = :month")
    List<CalendarEntry> findByUserAndMonth(Long userId, int year, int month);

    Optional<CalendarEntry> findByUserIdAndDate(Long userId, java.time.LocalDate date);
}
