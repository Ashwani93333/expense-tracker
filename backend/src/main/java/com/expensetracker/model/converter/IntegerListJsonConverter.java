package com.expensetracker.model.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

/**
 * Persists a {@code List<Integer>} as a JSON array in a TEXT column.
 * Matches the existing TEXT-as-JSON convention used across this schema
 * (e.g. GroupMonthlyReport JSON breakdowns, categories.keywords).
 */
@Converter
public class IntegerListJsonConverter implements AttributeConverter<List<Integer>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<Integer>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<Integer> attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize threshold list", e);
        }
    }

    @Override
    public List<Integer> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(dbData, TYPE);
        } catch (Exception e) {
            return List.of();
        }
    }
}
