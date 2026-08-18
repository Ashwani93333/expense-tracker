package com.expensetracker.report;

import com.expensetracker.report.dto.GroupAnalyticsDto;
import com.expensetracker.report.dto.GroupMonthlyReportDto;
import com.expensetracker.report.dto.SettlementSummaryDto;
import com.expensetracker.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class GroupReportController {

    private final SettlementService settlementService;
    private final GroupReportService groupReportService;

    public GroupReportController(SettlementService settlementService,
                                  GroupReportService groupReportService) {
        this.settlementService = settlementService;
        this.groupReportService = groupReportService;
    }

    /** GET /api/groups/{id}/settlements?month=2026-08 */
    @GetMapping("/{id}/settlements")
    public ResponseEntity<List<SettlementSummaryDto>> getSettlements(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(settlementService.computeSettlements(principal.getId(), id, month));
    }

    /** GET /api/groups/{id}/reports/monthly?month=2026-08 */
    @GetMapping("/{id}/reports/monthly")
    public ResponseEntity<GroupMonthlyReportDto> getMonthlyReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(groupReportService.getMonthlyReport(principal.getId(), id, month));
    }

    /** GET /api/groups/{id}/reports/analytics?month=2026-08 */
    @GetMapping("/{id}/reports/analytics")
    public ResponseEntity<GroupAnalyticsDto> getAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(groupReportService.getAnalytics(principal.getId(), id, month));
    }
}
