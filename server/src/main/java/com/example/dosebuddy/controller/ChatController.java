package com.example.dosebuddy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.dosebuddy.dto.ChatRequest;
import com.example.dosebuddy.dto.ChatResponse;
import com.example.dosebuddy.model.ChatMessage;
import com.example.dosebuddy.service.ChatService;
import com.example.dosebuddy.service.PdfService;
import com.example.dosebuddy.service.TextChunkService;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"})
public class ChatController {
    private final ChatService chatService;
    private final PdfService pdfService;
    private final TextChunkService textChunkService;

    public ChatController(ChatService chatService, PdfService pdfService, TextChunkService textChunkService) {
        this.chatService = chatService;
        this.pdfService = pdfService;
        this.textChunkService = textChunkService;
    }

    @GetMapping("/chat/health")
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "service", "DoseBuddy AI Chat Assistant",
            "features", List.of("Memory", "Gemini AI", "Prescription RAG")
        );
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            return new ChatResponse("Please provide a question or message for DoseBuddy.");
        }
        String conversationId = request.getConversationId();
        String response = chatService.generateResponse(request.getMessage(), conversationId);
        return new ChatResponse(response);
    }

    @GetMapping("/chat/history/{conversationId}")
    public List<ChatMessage> getHistory(@PathVariable String conversationId) {
        return chatService.getHistory(conversationId);
    }

    @DeleteMapping("/chat/history/{conversationId}")
    public ResponseEntity<Map<String, String>> clearHistory(@PathVariable String conversationId) {
        chatService.clearHistory(conversationId);
        return ResponseEntity.ok(Map.of("message", "Conversation history cleared successfully"));
    }

    // ==========================================
    // RAG INGESTION & DOCUMENT UPLOAD (PDF)
    // ==========================================
    @PostMapping("/rag/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "conversationId", required = false) String conversationId) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please select a valid PDF file."));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are supported."));
        }

        try {
            // 1. Extract text using PdfBox
            String text = pdfService.extractText(file);
            if (text == null || text.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "The uploaded PDF does not contain readable text."));
            }

            // 2. Split into chunks
            List<String> chunks = textChunkService.splitText(text);

            // 3. Attach chunks to conversation memory for RAG
            chatService.saveDocumentChunks(conversationId, chunks);

            return ResponseEntity.ok(Map.of(
                "fileName", file.getOriginalFilename(),
                "characters", text.length(),
                "chunks", chunks.size(),
                "message", "Prescription document successfully ingested into DoseBuddy AI memory!"
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process PDF: " + e.getMessage()));
        }
    }

    @PostMapping("/rag/chat")
    public ResponseEntity<Map<String, String>> ragChat(@RequestBody ChatRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }
        String answer = chatService.generateResponse(request.getMessage(), request.getConversationId());
        return ResponseEntity.ok(Map.of("response", answer));
    }
}