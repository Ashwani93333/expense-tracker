package com.expensetracker.expense.ocr;

import com.expensetracker.classification.CategoryClassificationInput;
import com.expensetracker.classification.CategoryClassificationResult;
import com.expensetracker.classification.ExpenseCategoryClassifier;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class ReceiptAnalysisService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final ExpenseCategoryClassifier categoryClassifier;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    public ReceiptAnalysisService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper,
                                  ExpenseCategoryClassifier categoryClassifier) {
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com/v1beta/models").build();
        this.objectMapper = objectMapper;
        this.categoryClassifier = categoryClassifier;
    }

    public ReceiptAnalysisResponse analyzeReceipt(Path imagePath, UUID userId) throws Exception {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new RuntimeException("Gemini API key is not configured.");
        }

        byte[] imageBytes = Files.readAllBytes(imagePath);
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        String mimeType = Files.probeContentType(imagePath);
        if (mimeType == null) {
            mimeType = "image/jpeg";
        }

        String prompt = "Extract the Merchant Name, Total Amount, Date (YYYY-MM-DD), and guess the Category from this receipt. " +
                "Return ONLY a JSON object with keys: merchantName (string), totalAmount (number), date (YYYY-MM-DD string), category (string).";

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of(
                    "parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of(
                            "mime_type", mimeType,
                            "data", base64Image
                        ))
                    )
                )
            ),
            "generationConfig", Map.of(
                "responseMimeType", "application/json"
            )
        );

        String response = webClient.post()
            .uri("/" + geminiModel + ":generateContent?key=" + geminiApiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        JsonNode root = objectMapper.readTree(response);
        JsonNode messageContent = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
        
        String jsonString = messageContent.asText();
        // Sometimes Gemini wraps JSON in markdown blocks even with responseMimeType
        if (jsonString.startsWith("```json")) {
            jsonString = jsonString.substring(7, jsonString.length() - 3).trim();
        }
        
        JsonNode resultNode = objectMapper.readTree(jsonString);

        ReceiptAnalysisResponse result = new ReceiptAnalysisResponse();
        result.setMerchantName(resultNode.path("merchantName").asText(null));
        
        if (resultNode.hasNonNull("totalAmount")) {
            result.setTotalAmount(new BigDecimal(resultNode.path("totalAmount").asText()));
        }
        
        if (resultNode.hasNonNull("date")) {
            try {
                result.setDate(LocalDate.parse(resultNode.path("date").asText()));
            } catch (Exception e) {
                // Ignore parsing errors, keep null
            }
        }
        
        result.setCategory(resultNode.path("category").asText(null));

        // The AI's category guess is treated as a hint only — never assigned
        // blindly. Run the deterministic classifier on the merchant text + AI guess.
        classifyReceiptCategory(result, userId);

        return result;
    }

    /**
     * Resolves the receipt category through the same classification pipeline as
     * manual expense creation, so the OCR endpoint never invents categories. The
     * AI's guess is folded into the classifier input; the resolved category id and
     * source are returned alongside the raw guess.
     */
    private void classifyReceiptCategory(ReceiptAnalysisResponse result, UUID userId) {
        String description = result.getMerchantName();
        if (result.getCategory() != null && !result.getCategory().isBlank()) {
            description = description == null
                    ? result.getCategory()
                    : description + " " + result.getCategory();
        }
        CategoryClassificationInput input = CategoryClassificationInput.builder()
                .userId(userId)
                .merchant(result.getMerchantName())
                .description(description)
                .rawText(null)
                .amount(result.getTotalAmount())
                .build();
        CategoryClassificationResult classification = categoryClassifier.classify(input);
        result.setCategoryId(classification.getCategoryId());
        result.setCategorySource(classification.getSource().name());
        result.setCategoryConfidence(classification.getConfidenceScore());
    }
}
