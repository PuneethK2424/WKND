package com.adobe.aem.guides.wknd.core.models;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
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

@Component(service = Servlet.class,
        property = {
                "sling.servlet.paths=/bin/create-playlist" ,
                "sling.servlet.methods=POST",
        })
public class CreatePlaylistServlet extends SlingAllMethodsServlet {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {

        Map<String, String> userResponse = new HashMap<>();

        // extract videoId & playlist name from request
        try {
            String body;
            try (BufferedReader reader = request.getReader()) {
                body = reader.lines().collect(Collectors.joining(System.lineSeparator()));
            }

            JsonObject jsonObject = JsonParser.parseString(body).getAsJsonObject();
            String playlistName = jsonObject.get("playlistName").getAsString();
            String videoId = jsonObject.has("videoId") ? jsonObject.get("videoId").getAsString() : null;

            logger.info("VideoId: {}, Playlist-Name: {}", videoId, playlistName);

            // get resource resolver
            ResourceResolver resourceResolver = request.getResourceResolver();

            logger.info("Current User: {}", resourceResolver.getUserID());

            createPlaylist(playlistName, videoId, resourceResolver, userResponse);

            response.setHeader("Content-Type", "application/json");
            response.getWriter().write(new Gson().toJson(userResponse));

        } catch (Exception exception) {
            response.setHeader("Content-Type", "application/json");

            userResponse.put("status", "failed");
            userResponse.put("message", "Error while creating playlist: " + exception.getMessage());
            logger.error("Exception caught: {}", exception.getMessage());
            response.getWriter().write(new Gson().toJson(userResponse));
        }
    }

    private void createPlaylist(String playlistName, String videoId, ResourceResolver resourceResolver, Map<String, String> userResponse) {
        // Get session from resource resolver
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                logger.error("Session is null");
                userResponse.put("status", "failed");
                userResponse.put("message", "Could not retrieve session from ResourceResolver.");
                return;
            }

            // Get user ID from session
            String username = session.getUserID();

            // Parent folder for all users' data
            Node rootFolderNode = session.getNode(Constants.ROOT_FOLDER_PATH);

            logger.info("Root folder path: {}", rootFolderNode.getPath());

            // Create or get user-specific node
            Node userSpecificNode = PlaylistMetadataUtils.getOrCreateNode(rootFolderNode, username);

            // Create a new node for playlist under user-specific node
            Node playlistNode = PlaylistMetadataUtils.createPlaylistNode(userSpecificNode, playlistName);

            if (playlistNode == null) {
                logger.error("Playlist '{}' already exists", playlistName);
                userResponse.put("status", "failed");
                userResponse.put("message", "Playlist " + playlistName + " already exists.");
                return;
            }

            // If new playlist, add videoUrls property
            String[] videosList = videoId == null ? new String[]{} : new String[]{videoId};
            playlistNode.setProperty("videoUrls", videosList);

            session.save();
            logger.info("Playlist Created: {}", playlistNode.getPath());
            userResponse.put("status", "success");
            userResponse.put("message", "Playlist " + playlistName + " created successfully.");
        } catch (Exception exception) {
            userResponse.put("status", "failed");
            userResponse.put("message", "Error while creating playlist: " + exception.getMessage());
            logger.error("Exception caught while creating playlist: {}", exception.getMessage());
        }
    }
}