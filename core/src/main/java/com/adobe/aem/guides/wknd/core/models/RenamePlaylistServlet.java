package com.adobe.aem.guides.wknd.core.models;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
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
@SlingServletResourceTypes(resourceTypes = "wknd/components/abbvie-playlist", selectors = "renamePlaylist", extensions = "json", methods = HttpConstants.METHOD_POST)
public class RenamePlaylistServlet extends SlingAllMethodsServlet {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        Map<String, String> userResponse = new HashMap<>();

        try {
            String body;
            try (BufferedReader reader = request.getReader()) {
                body = reader.lines().collect(Collectors.joining(System.lineSeparator()));
            }

            JsonObject jsonObject = JsonParser.parseString(body).getAsJsonObject();
            String playlistName = jsonObject.get("playlistName").getAsString();
            String previousPlaylistName = jsonObject.get("previousPlaylistName").getAsString();

            logger.info("Previous Playlist Name: {}, Updated Playlist Name: {}", previousPlaylistName, playlistName);

            ResourceResolver resourceResolver = request.getResourceResolver();
            logger.info("Current User: {}", resourceResolver.getUserID());

            renamePlaylist(playlistName, previousPlaylistName, resourceResolver, userResponse);

            response.setHeader("Content-Type", "application/json");
            response.getWriter().write(new Gson().toJson(userResponse));
        } catch (Exception exception) {
            response.setHeader("Content-Type", "application/json");
            logger.error("Exception caught: {}", exception.getMessage());
            userResponse.put("status", "failed");
            userResponse.put("message", "Error while renaming playlist: " + exception.getMessage());
            response.getWriter().write(new Gson().toJson(userResponse));
        }
    }

    private void renamePlaylist(String playlistName, String previousPlaylistName, ResourceResolver resourceResolver, Map<String, String> userResponse) {
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                logger.error("Session is null");
                userResponse.put("status", "failed");
                userResponse.put("message", "Could not get session from resource resolver.");
                return;
            }

            String username = session.getUserID();
            Node rootFolderNode = session.getNode(Constants.ROOT_FOLDER_PATH);
            logger.info("Root folder path: {}", rootFolderNode.getPath());

            Node userSpecificNode = PlaylistMetadataUtils.getOrCreateNode(rootFolderNode, username);
            Node playlistNode = PlaylistMetadataUtils.getNode(userSpecificNode, previousPlaylistName);

            if (playlistNode == null) {
                logger.error("Playlist '{}' not found for user '{}'", previousPlaylistName, username);
                userResponse.put("status", "failed");
                userResponse.put("message", "Playlist " + previousPlaylistName + " not found.");
                return;
            }

            if (playlistName.equals(previousPlaylistName)) {
                logger.warn("New and old playlist names are the same: '{}'", playlistName);
                userResponse.put("status", "failed");
                userResponse.put("message", "New playlist name is the same as the old one.");
                return;
            }

            String oldPath = playlistNode.getPath();
            String newPath = userSpecificNode.getPath() + "/" + playlistName;

            Session playlistSession = playlistNode.getSession();
            playlistNode.remove();
            playlistSession.getWorkspace().copy(oldPath, newPath);
            session.save();
            logger.info("Playlist renamed from '{}' to '{}'", previousPlaylistName, playlistName);
            userResponse.put("status", "success");
            userResponse.put("message", "Playlist renamed to " + playlistName + " successfully.");
        } catch (Exception exception) {
            logger.error("Exception caught while renaming playlist: {}", exception.getMessage());
            userResponse.put("status", "failed");
            userResponse.put("message", "Error while renaming playlist: " + exception.getMessage());
        }
    }
}