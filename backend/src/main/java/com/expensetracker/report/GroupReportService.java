package com.expensetracker.report;

import com.expensetracker.common.DateRangeResolver;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.report.dto.GroupAnalyticsDto;
import com.expensetracker.report.dto.GroupMonthlyReportDto;
import com.expensetracker.repository.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class GroupReportService {

    private final GroupMemberRepository groupMemberRepository;
    private final GroupReportCache reportCache;

    public GroupReportService(GroupMemberRepository groupMemberRepository, GroupReportCache reportCache) {
        this.groupMemberRepository = groupMemberRepository;
        this.reportCache = reportCache;
    }

    /**
     * Membership is re-checked on every call, before the cache is consulted, so
     * that a cache hit can never serve a report to a user who has since left the
     * group. The date range is resolved before delegating so that the cache key
     * is the concrete range rather than the raw request parameters.
     */
    @Transactional(readOnly = true)
    public GroupMonthlyReportDto getMonthlyReport(UUID userId, UUID groupId, String monthParam,
                                                  String year, String dateFrom, String dateTo) {
        requireMember(groupId, userId);
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        return reportCache.monthlyReport(groupId, range[0], range[1]);
    }

    @Transactional(readOnly = true)
    public GroupAnalyticsDto getAnalytics(UUID userId, UUID groupId, String monthParam,
                                          String year, String dateFrom, String dateTo) {
        requireMember(groupId, userId);
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        return reportCache.analytics(groupId, range[0], range[1]);
    }

    private void requireMember(UUID groupId, UUID userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "ACTIVE")) {
            throw new AccessDeniedException("You are not a member of this group");
        }
    }
}
