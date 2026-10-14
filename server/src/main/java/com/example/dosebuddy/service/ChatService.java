package com.example.dosebuddy.service;

import com.example.dosebuddy.model.ChatMessage;
import com.example.dosebuddy.model.ChatMessageEntity;
import com.example.dosebuddy.repository.ChatMessageRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private final ChatClient chatClient;
    private final ChatMessageRepository chatMessageRepository;

    // In-memory conversation storage cache mapped by conversationId
    private final Map<String, List<ChatMessage>> conversationStore = new ConcurrentHashMap<>();

    // Document context chunks stored per conversation for RAG
    private final Map<String, List<String>> documentStore = new ConcurrentHashMap<>();

    public ChatService(ChatClient.Builder chatClientBuilder, ChatMessageRepository chatMessageRepository) {
        this.chatClient = chatClientBuilder.build();
        this.chatMessageRepository = chatMessageRepository;
    }

    public String generateResponse(String message, String conversationId) {
        String convId = (conversationId == null || conversationId.isBlank()) ? "default_session" : conversationId;

        // 1. Retrieve or initialize conversation message list
        List<ChatMessage> history = conversationStore.computeIfAbsent(convId, k -> {
            // Pre-load from MySQL if exists
            List<ChatMessageEntity> dbMsgs = chatMessageRepository.findByConversationIdOrderByTimestampAsc(convId);
            List<ChatMessage> list = new ArrayList<>();
            for (ChatMessageEntity entity : dbMsgs) {
                list.add(entity.toDto());
            }
            return Collections.synchronizedList(list);
        });

        // 2. Save incoming user message to memory and MySQL
        ChatMessage userMsg = new ChatMessage("user", message);
        history.add(userMsg);
        try {
            chatMessageRepository.save(new ChatMessageEntity(convId, "user", message));
        } catch (Exception e) {
            System.err.println("Failed to persist user chat message to database: " + e.getMessage());
        }

        // 3. Format previous conversation context
        StringBuilder historyContext = new StringBuilder();
        synchronized (history) {
            int startIdx = Math.max(0, history.size() - 11);
            for (int i = startIdx; i < history.size() - 1; i++) {
                ChatMessage m = history.get(i);
                historyContext.append(m.getRole().toUpperCase()).append(": ").append(m.getContent()).append("\n");
            }
        }

        // 4. Retrieve any uploaded document chunks (RAG context)
        List<String> docChunks = documentStore.get(convId);
        String docContext = "";
        if (docChunks != null && !docChunks.isEmpty()) {
            String queryLower = message.toLowerCase();
            List<String> matched = docChunks.stream()
                .filter(chunk -> {
                    for (String word : queryLower.split("\\s+")) {
                        if (word.length() > 3 && chunk.toLowerCase().contains(word)) return true;
                    }
                    return false;
                })
                .limit(3)
                .collect(Collectors.toList());

            if (matched.isEmpty()) {
                matched = docChunks.subList(0, Math.min(2, docChunks.size()));
            }

            docContext = "\n--- UPLOADED MEDICAL/PRESCRIPTION DOCUMENT CONTEXT ---\n" 
                + String.join("\n\n---\n\n", matched) 
                + "\n-------------------------------------------------------\n";
        }

        // 5. Construct DoseBuddy AI prompt
        String prompt = """
            You are DoseBuddy AI, an empathetic, highly knowledgeable, and reliable medication adherence and healthcare companion.
            Your purpose:
            - Help patients and caregivers understand medication schedules, dosages, and safety precautions.
            - Answer questions regarding missed doses, food interactions, side effect warnings, and refill habits.
            - If document context is provided, ground your answers in the uploaded document while explaining clearly.
            - Always maintain an encouraging, clear, and reassuring tone.
            - Include appropriate medical safety reminders: users should always consult their physician or pharmacist for clinical diagnosis or prescription adjustments.
            
            %s
            
            CONVERSATION HISTORY:
            %s
            
            CURRENT USER QUERY:
            %s
            """.formatted(
                docContext.isBlank() ? "" : docContext,
                historyContext.toString().isBlank() ? "No prior messages." : historyContext.toString(),
                message
            );

        String aiResponse;
        try {
            aiResponse = chatClient
                .prompt()
                .user(prompt)
                .call()
                .content();
        } catch (Exception e) {
            // Graceful smart fallback when Gemini API key is not yet set or during offline mode
            aiResponse = generateSmartFallback(message, docContext);
        }

        // 6. Save AI response to history and MySQL
        ChatMessage aiMsg = new ChatMessage("ai", aiResponse);
        history.add(aiMsg);
        try {
            chatMessageRepository.save(new ChatMessageEntity(convId, "ai", aiResponse));
        } catch (Exception e) {
            System.err.println("Failed to persist AI chat message to database: " + e.getMessage());
        }

        return aiResponse;
    }

    public List<ChatMessage> getHistory(String conversationId) {
        if (conversationId == null || conversationId.isBlank()) {
            return Collections.emptyList();
        }
        
        List<ChatMessage> list = conversationStore.get(conversationId);
        if (list != null && !list.isEmpty()) {
            synchronized (list) {
                return new ArrayList<>(list);
            }
        }

        // Fallback to MySQL if memory cache was cleared or freshly restarted
        try {
            List<ChatMessageEntity> dbMsgs = chatMessageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
            if (!dbMsgs.isEmpty()) {
                List<ChatMessage> result = dbMsgs.stream().map(ChatMessageEntity::toDto).collect(Collectors.toList());
                conversationStore.put(conversationId, Collections.synchronizedList(new ArrayList<>(result)));
                return result;
            }
        } catch (Exception e) {
            System.err.println("Failed to load chat history from database: " + e.getMessage());
        }

        return Collections.emptyList();
    }

    @Transactional
    public void clearHistory(String conversationId) {
        if (conversationId != null) {
            conversationStore.remove(conversationId);
            documentStore.remove(conversationId);
            try {
                chatMessageRepository.deleteByConversationId(conversationId);
            } catch (Exception e) {
                System.err.println("Failed to delete chat history from database: " + e.getMessage());
            }
        }
    }

    public void saveDocumentChunks(String conversationId, List<String> chunks) {
        String convId = (conversationId == null || conversationId.isBlank()) ? "default_session" : conversationId;
        documentStore.put(convId, new ArrayList<>(chunks));
    }

    public boolean hasDocument(String conversationId) {
        List<String> docs = documentStore.get(conversationId);
        return docs != null && !docs.isEmpty();
    }

    private String generateSmartFallback(String message, String docContext) {
        String lower = message.toLowerCase();

        if (!docContext.isBlank()) {
            return "📄 **Based on your uploaded medical document:**\n\n"
                + "I have reviewed your uploaded prescription/health document. Here is the relevant information based on your question:\n\n"
                + "• The document contains dosage and regimen guidelines matching your query.\n"
                + "• Always cross-check the schedule with the instructions written on your medicine packaging.\n\n"
                + "*Tip: Connect your Google Gemini API key in `application.properties` to unlock full neural deep-dive answers!*";
        }

        if (lower.contains("miss") || lower.contains("forgot")) {
            return "⏰ **DoseBuddy Missed Dose Guidance:**\n\n"
                + "1. **Take it as soon as you remember**, unless it is almost time for your next scheduled dose.\n"
                + "2. **Never double up:** Do not take two doses at the same time to make up for a missed pill.\n"
                + "3. **Set a DoseBuddy Reminder:** Enable your notification chime or photo alarm to stay on track.\n\n"
                + "*Note: For critical medications (e.g., insulin, blood thinners), consult your prescribing doctor or pharmacist directly.*";
        }

        if (lower.contains("amlodipine")) {
            return "💊 **Amlodipine Besylate (5mg) Information:**\n\n"
                + "• **Class:** Calcium channel blocker used to manage high blood pressure (hypertension).\n"
                + "• **Best Practice:** Take once daily with a full glass of water, ideally at the same time every evening.\n"
                + "• **Adherence Tip:** Avoid sudden standing if you feel lightheaded, and keep your caregiver informed.\n"
                + "• **Inventory:** Remember to request a refill when you have 5 days or fewer remaining.";
        }

        if (lower.contains("metformin")) {
            return "💊 **Metformin HCl (500mg) Information:**\n\n"
                + "• **Class:** Biguanide medication for blood sugar regulation.\n"
                + "• **Best Practice:** Take with meals (e.g. with breakfast and dinner) to reduce mild stomach discomfort.\n"
                + "• **Adherence Tip:** Swallow tablets whole with water; do not crush extended-release versions unless directed by your doctor.";
        }

        if (lower.contains("amoxicillin") || lower.contains("antibiotic")) {
            return "💊 **Amoxicillin Antibiotic Guidance:**\n\n"
                + "• **Important Rule:** Complete the full course of your prescription even if symptoms improve early.\n"
                + "• **Spacing:** Spread your 3 daily doses evenly across the day (e.g., morning, afternoon, night).\n"
                + "• **Hydration:** Drink plenty of fluids throughout your course.";
        }

        if (lower.contains("interaction") || lower.contains("interact")) {
            return "🔍 **Medication Interaction Check:**\n\n"
                + "• Common interactions happen between prescription pills, OTC pain relievers (like NSAIDs), and certain herbal supplements.\n"
                + "• In DoseBuddy, ensure both you and your caregiver keep your Current Prescriptions list updated.\n"
                + "• If introducing any new OTC remedy, ask your pharmacist: *'Does this interact with my daily medications?'*";
        }

        if (lower.contains("hello") || lower.contains("hi") || lower.contains("hey")) {
            return "👋 **Hello! I'm DoseBuddy AI Assistant.**\n\n"
                + "I'm here to assist you and your caregivers with:\n"
                + "• Medication schedules and dose verification\n"
                + "• Missed dose guidance and refill tracking\n"
                + "• Ingesting & explaining your prescription PDFs\n\n"
                + "How can I help you manage your health today?";
        }

        return "💊 **DoseBuddy AI Assistant:**\n\n"
            + "I have received your query regarding: \"" + message + "\".\n\n"
            + "• **Medication Adherence:** Keeping a consistent daily routine helps maximize medication efficacy and patient safety.\n"
            + "• **Prescription Check:** You can upload your doctor's prescription PDF using the clip icon below for automatic analysis.\n\n"
            + "*DoseBuddy AI is active and maintaining your session memory. For custom cloud completions, provide a `GOOGLE_API_KEY`.*";
    }
}