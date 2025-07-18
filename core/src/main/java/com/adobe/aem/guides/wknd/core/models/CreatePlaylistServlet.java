package com.adobe.aem.guides.wknd.core.models;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.*;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.ServletResolverConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.jcr.Session;
import javax.servlet.Servlet;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component(service = Servlet.class,
        property = {
                ServletResolverConstants.SLING_SERVLET_PATHS + "=/bin/wknd/abbvie-playlist",
                ServletResolverConstants.SLING_SERVLET_SELECTORS + "=create-playlist",
                ServletResolverConstants.SLING_SERVLET_EXTENSIONS + "=json",
                ServletResolverConstants.SLING_SERVLET_METHODS + "=" + HttpConstants.METHOD_POST
        })
public class CreatePlaylistServlet extends SlingAllMethodsServlet {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

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
            ResourceResolver resourceResolver = ResourceResolverUtils.getResourceResolver(resourceResolverFactory);

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

            logger.info("UserName: {}", username);

            // hcp profile resource
            Resource hcpProfileResource = PlaylistStorageUtils.getHCPProfileResource(resourceResolver, username);

            if (hcpProfileResource == null) {
                logger.info("HCP Profile is null. No HCP Found");
                userResponse.put("status", "failed");
                userResponse.put("message", "HCP Not Found.");
                return;
            }

            // create playlist
            String bucketFolderName = PlaylistStorageUtils.getBucketFolderName(playlistName);

            Resource bucketFolder = PlaylistStorageUtils.getOrCreateBucketFolder(resourceResolver, hcpProfileResource, bucketFolderName);
            logger.info("This is bucket path: {}", bucketFolder.getPath());

            Resource playlist = PlaylistStorageUtils.getOrCreatePlaylist(resourceResolver, bucketFolder, playlistName);

            // If new playlist, add videoUrls
            ModifiableValueMap playlistProperties = playlist.adaptTo(ModifiableValueMap.class);

            if (playlistProperties == null) {
                logger.info("Failed to load playlist properties");
                userResponse.put("status", "failed");
                userResponse.put("message", "Failed to load playlist properties.");
                return;
            }
            String[] videosList = videoId == null ? new String[]{} : new String[]{videoId};
            playlistProperties.put("videoUrls", videosList);

            session.save();
            resourceResolver.commit();
            logger.info("Playlist Created: {}", playlist.getPath());
            userResponse.put("status", "success");
            userResponse.put("message", "Playlist " + playlistName + " created successfully.");

            // replicate
            String payload = "{\"contentpath\": \"/conf/hcp-playlists\"}";
            ServletUtils.replicateDataToPublish(Constants.REPLICATE_URL, payload);

        } catch (Exception exception) {
            userResponse.put("status", "failed");
            userResponse.put("message", "Error while creating playlist: " + exception.getMessage());
            logger.error("Exception caught while creating playlist: {}", exception.getMessage());
        }
    }
}