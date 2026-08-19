package com.expensetracker.group;

import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.group.dto.*;
import com.expensetracker.mail.EmailService;
import com.expensetracker.mail.EmailService.GroupInviteEmailData;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.GroupInvite;
import com.expensetracker.model.GroupMember;
import com.expensetracker.model.User;
import com.expensetracker.notification.NotificationService;
import com.expensetracker.repository.ExpenseGroupRepository;
import com.expensetracker.repository.GroupInviteRepository;
import com.expensetracker.repository.GroupMemberRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupService {

    private static final String INVITE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int INVITE_CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ExpenseGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupInviteRepository inviteRepository;
    private final GroupRoleGuard roleGuard;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public GroupService(
            ExpenseGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            GroupInviteRepository inviteRepository,
            GroupRoleGuard roleGuard,
            NotificationService notificationService,
            EmailService emailService) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.inviteRepository = inviteRepository;
        this.roleGuard = roleGuard;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional
    public GroupDto createGroup(User creator, CreateGroupRequest req) {
        String inviteCode = generateUniqueInviteCode();
        ExpenseGroup group = new ExpenseGroup();
        group.setName(req.getName().trim());
        group.setDescription(req.getDescription());
        group.setCurrencyCode(req.getCurrencyCode() != null ? req.getCurrencyCode() : "INR");
        group.setCreatedBy(creator);
        group.setInviteCode(inviteCode);
        group.setIsActive(true);
        if (req.getExpiresAt() != null) {
            group.setExpiresAt(req.getExpiresAt());
        }
        ExpenseGroup saved = groupRepository.save(group);

        // Creator becomes ADMIN
        GroupMember adminMember = new GroupMember();
        adminMember.setGroup(saved);
        adminMember.setUser(creator);
        adminMember.setRole("ADMIN");
        adminMember.setStatus("ACTIVE");
        memberRepository.save(adminMember);

        return GroupDto.fromEntity(saved, 1L, "ADMIN");
    }

    @Transactional(readOnly = true)
    public List<GroupDto> getGroupsForUser(User user) {
        return groupRepository.findGroupsByUserId(user.getId()).stream()
                .map(g -> {
                    long count = memberRepository.countByGroupIdAndStatus(g.getId(), "ACTIVE");
                    String role = memberRepository.findByGroupIdAndUserId(g.getId(), user.getId())
                            .map(GroupMember::getRole).orElse("MEMBER");
                    return GroupDto.fromEntity(g, count, role);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGroupDetail(User user, UUID groupId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        roleGuard.requireMember(groupId, user.getId());

        long count = memberRepository.countByGroupIdAndStatus(groupId, "ACTIVE");
        String role = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .map(GroupMember::getRole).orElse("MEMBER");
        GroupDto groupDto = GroupDto.fromEntity(group, count, role);

        List<GroupMemberDto> members = memberRepository.findByGroupIdAndStatus(groupId, "ACTIVE")
                .stream().map(GroupMemberDto::fromEntity).collect(Collectors.toList());

        return Map.of("group", groupDto, "members", members);
    }

    @Transactional
    public GroupDto updateGroup(User user, UUID groupId, UpdateGroupRequest req) {
        roleGuard.requireAdmin(groupId, user.getId());
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        if (req.getName() != null) group.setName(req.getName().trim());
        if (req.getDescription() != null) group.setDescription(req.getDescription());
        if (req.getExpiresAt() != null) group.setExpiresAt(req.getExpiresAt());
        ExpenseGroup saved = groupRepository.save(group);
        long count = memberRepository.countByGroupIdAndStatus(groupId, "ACTIVE");
        return GroupDto.fromEntity(saved, count, "ADMIN");
    }

    @Transactional
    public void deactivateGroup(User user, UUID groupId) {
        roleGuard.requireAdmin(groupId, user.getId());
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        group.setIsActive(false);
        groupRepository.save(group);
    }

    @Transactional
    public Map<String, Object> createInvite(User user, UUID groupId, CreateInviteRequest req) {
        roleGuard.requireMember(groupId, user.getId());
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        String rawToken = GroupInviteToken.generate();
        String hashedToken = GroupInviteToken.hash(rawToken);
        OffsetDateTime expiresAt = req.getExpiresAt() != null
                ? req.getExpiresAt()
                : OffsetDateTime.now().plusDays(7);

        GroupInvite invite = new GroupInvite();
        invite.setGroup(group);
        invite.setInvitedEmail(req.getEmail());
        invite.setInvitedBy(user);
        invite.setToken(hashedToken);
        invite.setExpiresAt(expiresAt);
        invite.setStatus("PENDING");
        inviteRepository.save(invite);

        String emailStatus = "PENDING";
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            emailStatus = sendInviteEmail(req.getEmail(), user, group, expiresAt, rawToken) ? "SENT" : "FAILED";
            invite.setEmailStatus(emailStatus);
            if ("SENT".equals(emailStatus)) {
                invite.setEmailSentAt(OffsetDateTime.now());
            } else {
                invite.setEmailFailureReason("SMTP delivery failed");
            }
            inviteRepository.save(invite);
        }

        return Map.of(
                "token", rawToken,
                "inviteCode", group.getInviteCode(),
                "expiresAt", expiresAt,
                "inviteLink", "/api/groups/join?token=" + rawToken,
                "emailStatus", emailStatus
        );
    }

    @Transactional
    public Map<String, Object> resendInvite(User user, UUID groupId, UUID inviteId) {
        roleGuard.requireMember(groupId, user.getId());
        GroupInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found: " + inviteId));
        if (!invite.getGroup().getId().equals(groupId)) {
            throw new BadRequestException("Invite does not belong to this group");
        }
        if (!"PENDING".equals(invite.getStatus())) {
            throw new BadRequestException("Only pending invites can be resent");
        }
        if (invite.getInvitedEmail() == null || invite.getInvitedEmail().isBlank()) {
            throw new BadRequestException("This invite has no email address to resend to");
        }
        ExpenseGroup group = invite.getGroup();
        // We only stored the hash; regenerate a fresh token so the old link is revoked.
        String rawToken = GroupInviteToken.generate();
        String hashedToken = GroupInviteToken.hash(rawToken);
        invite.setToken(hashedToken);
        invite.setEmailStatus(null);
        invite.setEmailFailureReason(null);
        inviteRepository.save(invite);

        boolean sent = sendInviteEmail(invite.getInvitedEmail(), invite.getInvitedBy(), group,
                invite.getExpiresAt(), rawToken);
        invite.setEmailStatus(sent ? "SENT" : "FAILED");
        if (sent) {
            invite.setEmailSentAt(OffsetDateTime.now());
        } else {
            invite.setEmailFailureReason("SMTP delivery failed");
        }
        inviteRepository.save(invite);

        return Map.of(
                "token", rawToken,
                "inviteLink", "/api/groups/join?token=" + rawToken,
                "emailStatus", invite.getEmailStatus()
        );
    }

    /** Public invite preview used by the frontend before joining. Never returns the raw token. */
    @Transactional(readOnly = true)
    public Map<String, Object> getInviteInfo(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException("Token is required");
        }
        GroupInvite invite = inviteRepository.findByTokenOrRaw(GroupInviteToken.hash(rawToken), rawToken)
                .orElseThrow(() -> new BadRequestException("Invalid or expired invite token"));
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("groupName", invite.getGroup().getName());
        info.put("groupDescription", invite.getGroup().getDescription());
        info.put("inviterName", invite.getInvitedBy().getFullName());
        info.put("expiresAt", invite.getExpiresAt());
        info.put("status", invite.getStatus());
        info.put("expired", invite.getExpiresAt().isBefore(OffsetDateTime.now()));
        return info;
    }

    @Transactional
    public GroupDto joinGroup(User user, JoinGroupRequest req) {
        ExpenseGroup group = null;

        if (req.getToken() != null && !req.getToken().isBlank()) {
            // Join via email/link invite token. New invites store a SHA-256 hash;
            // legacy invites stored the raw token — both lookups keep old links working.
            GroupInvite invite = inviteRepository.findByTokenOrRaw(GroupInviteToken.hash(req.getToken()), req.getToken())
                    .orElseThrow(() -> new BadRequestException("Invalid or expired invite token"));
            if (!"PENDING".equals(invite.getStatus())) {
                throw new BadRequestException("This invite has already been used or revoked");
            }
            if (invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
                invite.setStatus("EXPIRED");
                inviteRepository.save(invite);
                throw new BadRequestException("This invite has expired");
            }
            group = invite.getGroup();
            invite.setStatus("ACCEPTED");
            inviteRepository.save(invite);
        } else if (req.getCode() != null && !req.getCode().isBlank()) {
            // Join via short invite code
            group = groupRepository.findByInviteCode(req.getCode().toUpperCase())
                    .orElseThrow(() -> new BadRequestException("Invalid invite code"));
        } else {
            throw new BadRequestException("Either 'code' or 'token' must be provided");
        }

        if (!Boolean.TRUE.equals(group.getIsActive())) {
            throw new BadRequestException("This group is no longer active");
        }
        if (isGroupExpired(group)) {
            throw new BadRequestException("This group has expired and is no longer accepting new members");
        }

        // Check if already a member
        Optional<GroupMember> existing = memberRepository.findByGroupIdAndUserId(group.getId(), user.getId());
        if (existing.isPresent()) {
            GroupMember gm = existing.get();
            if ("ACTIVE".equals(gm.getStatus())) {
                throw new BadRequestException("You are already a member of this group");
            }
            // Re-join
            gm.setStatus("ACTIVE");
            gm.setRole("MEMBER");
            memberRepository.save(gm);
        } else {
            GroupMember gm = new GroupMember();
            gm.setGroup(group);
            gm.setUser(user);
            gm.setRole("MEMBER");
            gm.setStatus("ACTIVE");
            memberRepository.save(gm);
        }

        // Notify all admins
        final String joinerName = user.getFullName();
        final UUID groupRefId = group.getId();
        final String groupTitle = group.getName();
        memberRepository.findByGroupIdAndStatus(groupRefId, "ACTIVE").stream()
                .filter(gm -> "ADMIN".equals(gm.getRole()))
                .forEach(gm -> notificationService.createNotification(
                        gm.getUser(), "GROUP_JOIN_REQUEST",
                        joinerName + " joined " + groupTitle,
                        joinerName + " has joined your group.",
                        groupRefId, "GROUP"));

        long count = memberRepository.countByGroupIdAndStatus(group.getId(), "ACTIVE");
        return GroupDto.fromEntity(group, count, "MEMBER");
    }

    @Transactional
    public void removeMember(User admin, UUID groupId, UUID targetUserId) {
        roleGuard.requireAdmin(groupId, admin.getId());
        if (admin.getId().equals(targetUserId)) {
            throw new BadRequestException("You cannot remove yourself; use leave-group instead");
        }
        GroupMember target = memberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        target.setStatus("REMOVED");
        memberRepository.save(target);
    }

    @Transactional
    public void leaveGroup(User user, UUID groupId) {
        GroupMember gm = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new BadRequestException("You are not a member of this group"));
        if ("ADMIN".equals(gm.getRole())) {
            long adminCount = memberRepository.findByGroupIdAndStatus(groupId, "ACTIVE")
                    .stream().filter(m -> "ADMIN".equals(m.getRole())).count();
            if (adminCount <= 1) {
                throw new BadRequestException("You are the only admin. Promote another member before leaving.");
            }
        }
        gm.setStatus("LEFT");
        memberRepository.save(gm);
    }

    @Transactional
    public GroupMemberDto updateMemberRole(User admin, UUID groupId, UUID targetUserId, String newRole) {
        roleGuard.requireAdmin(groupId, admin.getId());
        if (!List.of("ADMIN", "MEMBER").contains(newRole)) {
            throw new BadRequestException("Role must be ADMIN or MEMBER");
        }
        GroupMember target = memberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));
        if (!"ACTIVE".equals(target.getStatus())) {
            throw new BadRequestException("Cannot change role of an inactive member");
        }
        target.setRole(newRole);
        return GroupMemberDto.fromEntity(memberRepository.save(target));
    }

    // --- helpers ---

    private boolean isGroupExpired(ExpenseGroup group) {
        return group.getExpiresAt() != null && group.getExpiresAt().isBefore(OffsetDateTime.now());
    }

    private boolean sendInviteEmail(String to, User invitedBy, ExpenseGroup group,
                                    OffsetDateTime expiresAt, String rawToken) {
        String inviteUrl = frontendBaseUrl + "/groups/join?token=" + rawToken;
        GroupInviteEmailData data = new GroupInviteEmailData(
                invitedBy.getFullName(), group.getName(), group.getDescription(), expiresAt, inviteUrl);
        return emailService.sendGroupInviteEmail(to, data);
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(INVITE_CODE_LENGTH);
            for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
                sb.append(INVITE_CODE_CHARS.charAt(RANDOM.nextInt(INVITE_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (groupRepository.findByInviteCode(code).isPresent());
        return code;
    }
}
