package com.expensetracker.model.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;
import java.util.UUID;

/**
 * Persists a {@code List<UUID>} as a JSON array in a TEXT column.
 * Matches the existing TEXT-as-JSON convention used across this schema.
 */
@Converter
public class UuidListJsonConverter implements AttributeConverter<List<UUID>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<UUID>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<UUID> attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize UUID list", e);
        }
    }

    @Override
    public List<UUID> convertToEntityAttribute(String dbData) {
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