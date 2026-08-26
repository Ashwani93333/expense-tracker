package com.expensetracker.expense.ocr;

import com.expensetracker.security.UserPrincipal;
import com.expensetracker.storage.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@RestController
@RequestMapping("/api/expenses/receipt")
public class ReceiptAnalysisController {

    private final StorageService storageService;
    private final ReceiptAnalysisService receiptAnalysisService;

    public ReceiptAnalysisController(StorageService storageService, ReceiptAnalysisService receiptAnalysisService) {
        this.storageService = storageService;
        this.receiptAnalysisService = receiptAnalysisService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<ReceiptAnalysisResponse> analyzeReceipt(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        try {
            String receiptHash = computeSha256(file);
            String filename = storageService.store(file);
            Path filePath = storageService.load(filename);

            ReceiptAnalysisResponse response = receiptAnalysisService.analyzeReceipt(filePath, principal.getId());
            response.setReceiptUrl(filename);
            response.setReceiptHash(receiptHash);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private String computeSha256(MultipartFile file) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream is = file.getInputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
        }
        byte[] hashBytes = digest.digest();
        StringBuilder sb = new StringBuilder(hashBytes.length * 2);
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
