package com.example.dosebuddy.service;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class TextChunkService {

    public List<String> splitText(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return chunks;
        }

        int chunkSize = 1200;
        int overlap = 200;
        int start = 0;

        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());
            // Try to end at a period or newline if possible
            if (end < text.length()) {
                int lastBreak = Math.max(text.lastIndexOf("\n", end), text.lastIndexOf(". ", end));
                if (lastBreak > start + (chunkSize / 2)) {
                    end = lastBreak + 1;
                }
            }
            String chunk = text.substring(start, end).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }
            if (end >= text.length()) {
                break;
            }
            start = Math.max(start + 1, end - overlap);
        }

        return chunks;
    }
}
