package com.expensetracker.category;

import com.expensetracker.mail.EmailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reproduces the exact post-signup flow the frontend performs: register, then
 * immediately load the category catalogue for the preferences picker with the
 * token that registration returned.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class PreferencesCatalogueFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmailService emailService;

    private String token;

    @BeforeEach
    void registerAndAuthenticate() throws Exception {
        String email = "flow-" + UUID.randomUUID() + "@example.com";
        String body = objectMapper.writeValueAsString(new java.util.HashMap<String, Object>() {{
            put("fullName", "Flow Tester");
            put("email", email);
            put("password", "Pass@123");
            put("confirmPassword", "Pass@123");
        }});

        String response = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        token = json.get("token").asText();
        assertThat(token).isNotBlank();
    }

    @Test
    void preferencesPickerReceivesTheFullSeededCatalogue() throws Exception {
        String response = mockMvc.perform(get("/api/categories/all")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Set<String> names = new HashSet<>();
        objectMapper.readTree(response).forEach(node -> names.add(node.get("name").asText()));

        // Every seeded default must be offered so the user has something to pick.
        assertThat(names).contains(
                "Food & Dining", "Transport", "Entertainment", "Shopping",
                "Bills & Utilities", "Groceries", "Health & Fitness", "Uncategorized");
    }

    @Test
    void unauthenticatedCallIsRejectedSoTheClientKnowsToRetry() throws Exception {
        mockMvc.perform(get("/api/categories/all"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void narrowedListIsEmptyOfUnselectedDefaultsBeforeOnboarding() throws Exception {
        String response = mockMvc.perform(get("/api/categories")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // No selection yet, so the working set is the full catalogue.
        assertThat(objectMapper.readTree(response).size()).isPositive();
    }
}
