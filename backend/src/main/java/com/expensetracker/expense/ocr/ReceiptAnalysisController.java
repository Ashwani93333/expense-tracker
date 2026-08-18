package com.expensetracker.expense.ocr;

import com.expensetracker.security.UserPrincipal;
import com.expensetracker.storage.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

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
            String filename = storageService.store(file);
            Path filePath = storageService.load(filename);

            ReceiptAnalysisResponse response = receiptAnalysisService.analyzeReceipt(filePath, principal.getId());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
