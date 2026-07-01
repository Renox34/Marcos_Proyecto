package com.vestry.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "calendar_entries",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "date"}))
public class CalendarEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outfit_id")
    private Outfit outfit;

    @Column(nullable = false)
    private LocalDate date;

    private String notes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Outfit getOutfit() { return outfit; }
    public void setOutfit(Outfit outfit) { this.outfit = outfit; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
