package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;

import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component(service = Servlet.class)
@SlingServletResourceTypes(resourceTypes = "wknd/components/abbvie-playlist", selectors = "addVideo", extensions = "json", methods = HttpConstants.METHOD_POST)
public class AddVideoServlet extends SlingAllMethodsServlet {

    private static final Logger log = LoggerFactory.getLogger(AddVideoServlet.class);

    @Reference
    private VideoPlaylistService videoPlaylistService;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String json = ServletUtils.getRequestBodyAsString(request);
        JsonNode responseJson;

        try {
            JsonNode jsonNode = objectMapper.readTree(json);
            log.info("Payload data from the Request: {}", jsonNode);

            String videoUrl = jsonNode.has("videoUrl") ? jsonNode.get("videoUrl").asText() : null;

            List<String> playlistNames = new ArrayList<>();
            if (jsonNode.has("playlistNames") && jsonNode.get("playlistNames").isArray()) {
                JsonArray array = JsonParser.parseString(jsonNode.get("playlistNames").toString()).getAsJsonArray();
                for (JsonElement element : array) {
                    if (element.isJsonPrimitive() && element.getAsJsonPrimitive().isString()) {
                        playlistNames.add(element.getAsString());
                    }
                }
            }

            if (videoUrl == null || playlistNames.isEmpty()) {
                responseJson = objectMapper.createObjectNode()
                        .put("status", "failed")
                        .put("message", "Missing videoUrl or playlistNames in JSON.");
                objectMapper.writeValue(response.getWriter(), responseJson);
                return;
            }

            // Call the service and get the full JsonNode response
            responseJson = videoPlaylistService.saveVideo(videoUrl, playlistNames, request.getResourceResolver());

        } catch (Exception e) {
            log.error("Exception while processing the request", e);
            responseJson = objectMapper.createObjectNode()
                    .put("status", "failed")
                    .put("message", "Internal server error: " + e.getMessage());
        }

        objectMapper.writeValue(response.getWriter(), responseJson);
    }
}
