package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.util.Map;
import java.util.stream.Collectors;

public class RequestProcessingUtils {

    private static final Logger logger = LoggerFactory.getLogger(RequestProcessingUtils.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static Map<String, Object> getInputs(SlingHttpServletRequest request) {
        try {
            String body;
            try (BufferedReader reader = request.getReader()) {
                body = reader.lines().collect(Collectors.joining(System.lineSeparator()));
            }

            return objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {});
        } catch (Exception exception) {
            logger.error("Exception caught while processing request, returning null: {}", exception.getMessage());
            return null;
        }
    }
}
