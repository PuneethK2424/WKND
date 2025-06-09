package com.adobe.aem.guides.wknd.core.models;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.Servlet;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component(service = Servlet.class)
@SlingServletResourceTypes(resourceTypes = "wknd/components/abbvie-playlist", selectors = "deletePlaylist", extensions = "json", methods = HttpConstants.METHOD_POST)
public class DeletePlaylistServlet extends SlingAllMethodsServlet {

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {

        Map<String, String> userResponse = new HashMap<>();

        // Extract playlist name from request
        try {
            String body;
            try (BufferedReader reader = request.getReader()) {
                body = reader.lines().collect(Collectors.joining(System.lineSeparator()));
            }

            JsonObject jsonObject = JsonParser.parseString(body).getAsJsonObject();
            String playlistName = jsonObject.get("playlistName").getAsString();
            logger.info("Playlist-Name: {}", playlistName);

            // Get resource resolver
            ResourceResolver resourceResolver = request.getResourceResolver();

            // Checking current user
            logger.info("Current User: {}", resourceResolver.getUserID());

            // Call method to delete the playlist
            deletePlaylist(playlistName, resourceResolver, userResponse);

            // Set response headers and send response
            response.setHeader("Content-Type", "application/json");
            response.getWriter().write(new Gson().toJson(userResponse));

        } catch (Exception exception) {
            response.setHeader("Content-Type", "application/json");

            // Handle exception and send error response
            logger.error("Exception caught: {}", exception.getMessage());
            userResponse.put("status", "failed");
            userResponse.put("message", "Error while deleting playlist: " + exception.getMessage());
            response.getWriter().write(new Gson().toJson(userResponse));
        }
    }

    private void deletePlaylist(String playlistName, ResourceResolver resourceResolver, Map<String, String> userResponse) {
        // Get session from resource resolver
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                logger.error("Session is null");
                userResponse.put("status", "failed");
                userResponse.put("message", "Session is null, could not delete playlist.");
                return;
            }

            // Get user ID from session
            String username = session.getUserID();

            // Parent folder for all users' data
            Node rootFolderNode = session.getNode(Constants.ROOT_FOLDER_PATH);

            logger.info("Root folder path: {}", rootFolderNode.getPath());

            // Get the user-specific node
            Node userSpecificNode = PlaylistMetadataUtils.getNode(rootFolderNode, username);

            if (userSpecificNode == null) {
                logger.error("No user found with username: {}", username);
                userResponse.put("status", "failed");
                userResponse.put("message", "No user found with username: " + username);
                return;
            }

            // Try to delete the playlist node
            boolean isDeleted = PlaylistMetadataUtils.deleteNode(userSpecificNode, playlistName);
            if (!isDeleted) {
                logger.error("Playlist '{}' not found or failed to delete.", playlistName);
                userResponse.put("status", "failed");
                userResponse.put("message", "Couldn't find or delete playlist with name: " + playlistName);
                return;
            }
            session.save();
            logger.info("Playlist '{}' deleted successfully", playlistName);

            userResponse.put("status", "success");
            userResponse.put("message", "Playlist " + playlistName + " deleted successfully.");
        } catch (Exception exception) {
            logger.error("Exception caught while deleting playlist: {}", exception.getMessage());
            userResponse.put("status", "failed");
            userResponse.put("message", "Error while deleting playlist: " + exception.getMessage());
        }
    }
}