package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import javax.servlet.ServletException;
import java.io.IOException;

@Component(service = Servlet.class)
@SlingServletResourceTypes(resourceTypes ="sling/servlet/default", selectors = "delete-video", extensions = "json", methods = HttpConstants.METHOD_POST)
public class DeleteVideoServlet extends SlingAllMethodsServlet {

    private static final Logger log = LoggerFactory.getLogger(DeleteVideoServlet.class);

    @Reference
    private VideoPlaylistService videoPlaylistService;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JsonNode responseJson;
        try {
            String json = ServletUtils.getRequestBodyAsString(request);
            JsonNode jsonNode = objectMapper.readTree(json);
            log.info("Payload data from the Request: {}", jsonNode);

            String videoUrl = jsonNode.has("videoUrl") ? jsonNode.get("videoUrl").asText() : null;
            String playlistName = jsonNode.has("playlistName") ? jsonNode.get("playlistName").asText() : null;

            if (videoUrl == null || playlistName == null) {
                responseJson = objectMapper.createObjectNode()
                        .put("status", "failed")
                        .put("message", "Missing videoUrl or playlistName in request body.");
                objectMapper.writeValue(response.getWriter(), responseJson);
                return;
            }

            // Use service and get structured response
            responseJson = videoPlaylistService.deleteVideo(playlistName, videoUrl, request.getResourceResolver());
        } catch (Exception e) {
            log.error("Error processing delete video request", e);
            responseJson = objectMapper.createObjectNode()
                    .put("status", "failed")
                    .put("message", "Internal server error: " + e.getMessage());
        }
        objectMapper.writeValue(response.getWriter(), responseJson);
    }

}