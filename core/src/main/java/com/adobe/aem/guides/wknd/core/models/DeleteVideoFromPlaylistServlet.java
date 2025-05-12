package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletPaths;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(service = Servlet.class)
@SlingServletPaths(value = "/bin/aemascs/deleteVideoFromPlaylist")
public class DeleteVideoFromPlaylistServlet extends SlingAllMethodsServlet {

    private static final Logger log = LoggerFactory.getLogger(DeleteVideoFromPlaylistServlet.class);

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
                response.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
                responseJson = objectMapper.createObjectNode()
                        .put("status", "failed")
                        .put("message", "Missing videoUrl or playlistName in request body.");
                objectMapper.writeValue(response.getWriter(), responseJson);
                return;
            }

            // Use service and get structured response
            responseJson = videoPlaylistService.deleteVideoFromPlaylist(playlistName, videoUrl, request.getResourceResolver());

            String status = responseJson.has("status") ? responseJson.get("status").asText() : "failed";
            if ("success".equalsIgnoreCase(status)) {
                response.setStatus(SlingHttpServletResponse.SC_OK);
            } else {
                response.setStatus(SlingHttpServletResponse.SC_NOT_FOUND);
            }

        } catch (Exception e) {
            log.error("Error processing delete video request", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            responseJson = objectMapper.createObjectNode()
                    .put("status", "failed")
                    .put("message", "Internal server error: " + e.getMessage());
        }
        objectMapper.writeValue(response.getWriter(), responseJson);
    }

}
