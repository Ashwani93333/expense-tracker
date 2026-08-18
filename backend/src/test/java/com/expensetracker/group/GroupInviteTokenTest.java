package com.expensetracker.group;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GroupInviteTokenTest {

    @Test
    void generateReturns64HexChars() {
        String token = GroupInviteToken.generate();
        assertThat(token).hasSize(64);
        assertThat(token).matches("[0-9a-f]{64}");
    }

    @Test
    void generateProducesDistinctTokens() {
        assertThat(GroupInviteToken.generate()).isNotEqualTo(GroupInviteToken.generate());
    }

    @Test
    void hashIsDeterministicSha256() {
        String digest = GroupInviteToken.hash("hello");
        assertThat(digest).hasSize(64);
        assertThat(digest).isEqualTo("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
        assertThat(GroupInviteToken.hash("hello")).isEqualTo(digest);
    }

    @Test
    void storedDigestNeverEqualsRawToken() {
        String token = GroupInviteToken.generate();
        assertThat(GroupInviteToken.hash(token)).isNotEqualTo(token);
    }
}
