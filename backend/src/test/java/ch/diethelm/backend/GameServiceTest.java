package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.repository.GameRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private GameService gameService;

    @Test
    void getAllGames_returnsListFromRepository() {
        List<Game> expected = List.of(
                createGame(1L, "The Witcher 3", "RPG", "http://example.com/witcher.jpg", LocalDate.of(2015, 5, 19)),
                createGame(2L, "Portal 2", "Puzzle", "http://example.com/portal2.jpg", LocalDate.of(2011, 4, 18))
        );

        when(gameRepository.findAll()).thenReturn(expected);

        List<Game> result = gameService.getAllGames();

        assertEquals(expected, result);
        verify(gameRepository).findAll();
    }

    @Test
    void getGameById_returnsGameWhenFound() {
        Game game = createGame(1L, "Half-Life 2", "Classic Shooter", "http://example.com/hl2.jpg", LocalDate.of(2004, 11, 16));

        when(gameRepository.findById(1L)).thenReturn(Optional.of(game));

        Game result = gameService.getGameById(1L);

        assertEquals(game, result);
        verify(gameRepository).findById(1L);
    }

    @Test
    void getGameById_throwsNoSuchElementWhenIdDoesNotExist() {
        when(gameRepository.findById(99L)).thenReturn(Optional.empty());

        NoSuchElementException exception = assertThrows(
                NoSuchElementException.class,
                () -> gameService.getGameById(99L)
        );

        assertEquals("Spiel mit ID 99 nicht gefunden", exception.getMessage());
    }

    @Test
    void createGame_savesAndReturnsGame() {
        Game input = createGame(null, "Stardew Valley", "Farming sim", "http://example.com/stardew.jpg", LocalDate.of(2016, 2, 26));
        Game saved = createGame(7L, "Stardew Valley", "Farming sim", "http://example.com/stardew.jpg", LocalDate.of(2016, 2, 26));

        when(gameRepository.save(input)).thenReturn(saved);

        Game result = gameService.createGame(input);

        assertEquals(saved, result);
        verify(gameRepository).save(input);
    }

    @Test
    void updateGame_overwritesAllExistingFields() {
        Game existing = createGame(1L, "Old Title", "Old description", "http://old.url", LocalDate.of(2000, 1, 1));
        Game updated = createGame(1L, "New Title", "New description", "http://new.url", LocalDate.of(2020, 12, 31));

        when(gameRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(gameRepository.save(existing)).thenReturn(existing);

        Game result = gameService.updateGame(1L, updated);

        assertAll(
                () -> assertEquals("New Title", result.getTitle()),
                () -> assertEquals("New description", result.getDescription()),
                () -> assertEquals("http://new.url", result.getImageUrl()),
                () -> assertEquals(LocalDate.of(2020, 12, 31), result.getReleaseDate())
        );
        verify(gameRepository).save(existing);
    }

    @Test
    void updateGame_throwsExceptionWhenIdDoesNotExist() {
        Game updated = createGame(1L, "Updated Title", "Updated description", "http://updated.url", LocalDate.of(2021, 10, 2));

        when(gameRepository.findById(42L)).thenReturn(Optional.empty());

        NoSuchElementException exception = assertThrows(
                NoSuchElementException.class,
                () -> gameService.updateGame(42L, updated)
        );

        assertEquals("Spiel mit ID 42 nicht gefunden", exception.getMessage());
        verify(gameRepository, never()).save(any());
    }

    @Test
    void deleteGame_deletesWhenGameExists() {
        when(gameRepository.existsById(1L)).thenReturn(true);

        gameService.deleteGame(1L);

        verify(gameRepository).deleteById(1L);
    }

    @Test
    void deleteGame_throwsExceptionWhenIdDoesNotExist() {
        when(gameRepository.existsById(99L)).thenReturn(false);

        NoSuchElementException exception = assertThrows(
                NoSuchElementException.class,
                () -> gameService.deleteGame(99L)
        );

        assertEquals("Spiel mit ID 99 nicht gefunden", exception.getMessage());
        verify(gameRepository, never()).deleteById(anyLong());
    }

    @Test
    void searchByTitle_delegatesToRepository() {
        String title = "craft";
        List<Game> expected = List.of(createGame(3L, "Minecraft", "Sandbox", "http://example.com/minecraft.jpg", LocalDate.of(2011, 11, 18)));

        when(gameRepository.findByTitleContainingIgnoreCase(title)).thenReturn(expected);

        List<Game> result = gameService.searchByTitle(title);

        assertEquals(expected, result);
        verify(gameRepository).findByTitleContainingIgnoreCase(title);
    }

    private Game createGame(Long id, String title, String description, String imageUrl, LocalDate releaseDate) {
        return Game.builder()
                .id(id)
                .title(title)
                .description(description)
                .imageUrl(imageUrl)
                .releaseDate(releaseDate)
                .build();
    }
}
