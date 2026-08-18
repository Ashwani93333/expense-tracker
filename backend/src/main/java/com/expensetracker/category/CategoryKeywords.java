package com.expensetracker.category;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

/** Serializes/deserializes the JSON keyword list stored in Category.keywords (TEXT). */
public final class CategoryKeywords {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};

    private CategoryKeywords() {}

    public static String toJson(ObjectMapper objectMapper, List<String> keywords) {
        try {
            return objectMapper.writeValueAsString(keywords == null ? List.of() : keywords);
        } catch (Exception e) {
            return "[]";
        }
    }

    public static List<String> parse(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return new ArrayList<>(CategoryKeywordsHolder.MAPPER.readValue(json, STRING_LIST));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /** Small holder so parse() works without an injected mapper in DTOs. */
    private static final class CategoryKeywordsHolder {
        static final ObjectMapper MAPPER = new ObjectMapper();
    }
}
