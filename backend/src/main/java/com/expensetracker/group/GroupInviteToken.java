package com.expensetracker.group;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Generates cryptographically strong group-invite tokens and their SHA-256
 * digests. Only the digest is stored in the database; the raw token is returned
 * to the inviter once (to share) and embedded in the invite email — it is never
 * persisted, never logged, and cannot be recovered from the DB.
 */
public final class GroupInviteToken {

    private static final SecureRandom RANDOM = new SecureRandom();

    private GroupInviteToken() {}

    /** 32 random bytes, hex-encoded → 64 chars. */
    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    /** SHA-256 hex digest (64 chars) of a raw token. */
    public static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
