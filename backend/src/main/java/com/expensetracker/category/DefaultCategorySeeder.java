package com.expensetracker.category;

import com.expensetracker.model.Category;
import com.expensetracker.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Seeds the system default categories (with classification keywords) exactly once.
 * Idempotent: existing default categories are updated with keywords only if they
 * don't already have them; nothing is ever deleted or overwritten.
 */
@Component
@Order(1)
public class DefaultCategorySeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultCategorySeeder.class);

    private final CategoryRepository categoryRepository;

    public DefaultCategorySeeder(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (Map.Entry<String, String[]> entry : defaults().entrySet()) {
            String name = entry.getKey();
            upsert(name, entry.getValue());
        }
        log.info("Default categories ensured");
    }

    private void upsert(String name, String[] keywords) {
        Category category = categoryRepository.findByNameIgnoreCase(name).orElse(null);
        if (category == null) {
            category = new Category();
            category.setName(name);
            category.setIsDefault(true);
            category.setIcon(defaultIcon(name));
            category.setColor(defaultColor(name));
            category.setKeywords(toJson(keywords));
            categoryRepository.save(category);
            log.info("Created default category: {}", name);
        } else if (category.getKeywords() == null || category.getKeywords().isBlank()) {
            category.setKeywords(toJson(keywords));
            categoryRepository.save(category);
            log.info("Backfilled keywords for default category: {}", name);
        }
    }

    private static String toJson(String[] values) {
        return CategoryKeywords.toJson(new ObjectMapper(), Arrays.asList(values));
    }

    private static String defaultIcon(String name) {
        return switch (name) {
            case "Food & Dining" -> "🍔";
            case "Transport" -> "🚕";
            case "Entertainment" -> "🎬";
            case "Shopping" -> "🛍️";
            case "Bills & Utilities" -> "💡";
            case "Groceries" -> "🛒";
            case "Health & Fitness" -> "💪";
            case "Uncategorized" -> "❓";
            default -> "📂";
        };
    }

    private static String defaultColor(String name) {
        return switch (name) {
            case "Food & Dining" -> "#F97316";
            case "Transport" -> "#3B82F6";
            case "Entertainment" -> "#A855F7";
            case "Shopping" -> "#EC4899";
            case "Bills & Utilities" -> "#FACC15";
            case "Groceries" -> "#22C55E";
            case "Health & Fitness" -> "#EF4444";
            case "Uncategorized" -> "#9E9E9E";
            default -> "#64748B";
        };
    }

    private static Map<String, String[]> defaults() {
        Map<String, String[]> map = new LinkedHashMap<>();
        map.put("Food & Dining", new String[]{"restaurant", "bikanervala", "zomato", "swiggy", "dominos",
                "pizza", "lunch", "dinner", "breakfast", "cafe", "coffee", "starbucks", "mcdonald", "burger",
                "dhaba", "food", "eatery", "delivery", "hotel", "dine", "snacks"});
        map.put("Transport", new String[]{"uber", "ola", "rapido", "metro", "bus", "fuel", "petrol", "diesel",
                "cab", "taxi", "auto", "train", "flight", "parking", "toll", "ride", "ev", "charging"});
        map.put("Entertainment", new String[]{"netflix", "spotify", "prime", "subscription", "movie", "cinema",
                "bookmyshow", "game", "steam", "youtube", "music", "entertainment", "ott", "ticket"});
        map.put("Shopping", new String[]{"amazon", "flipkart", "myntra", "shopping", "cloth", "apparel", "mall",
                "meesho", "ajio", "footwear", "fashion", "ecommerce", "store"});
        map.put("Bills & Utilities", new String[]{"electricity", "water bill", "internet", "wifi", "rent", "gas",
                "phone bill", "recharge", "broadband", "utility", "maintenance", "bill", "insurance", "emi"});
        map.put("Groceries", new String[]{"grocery", "bigbasket", "dmart", "reliance fresh", "more", "kirana",
                "supermarket", "vegetables", "milk", "meat", "provisions", "stationery"});
        map.put("Health & Fitness", new String[]{"pharmacy", "medicine", "doctor", "hospital", "gym", "fitness",
                "cult", "cult.fit", "medical", "diagnostic", "clinic"});
        map.put("Uncategorized", new String[]{});
        return map;
    }
}
