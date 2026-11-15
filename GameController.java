package com.example.platformer;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {

    // In-memory storage for high score (in a real app, use a database)
    private static int highScore = 0;

    /**
     * Endpoint to retrieve the current high score.
     * @return the high score
     */
    @GetMapping("/highscore")
    public int getHighScore() {
        return highScore;
    }

    /**
     * Endpoint to start a new game session.
     * Returns the current high score to display to the player.
     * @return a map containing the high score
     */
    @PostMapping("/start")
    public Map<String, Object> startGame() {
        Map<String, Object> response = new HashMap<>();
        response.put("highScore", highScore);
        return response;
    }

    /**
     * Endpoint to handle game over.
     * Updates the high score if the player's score is higher.
     * @param payload a map containing the player's score
     */
    @PostMapping("/over")
    public void gameOver(@RequestBody Map<String, Integer> payload) {
        int score = payload.get("score");
        if (score > highScore) {
            highScore = score;
        }
    }
}