package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.Session;
import javax.jcr.Value;
import java.util.*;

@Component(service = VideoPlaylistService.class)
public class VideoPlaylistServiceImpl implements VideoPlaylistService {
    private static final Logger log = LoggerFactory.getLogger(VideoPlaylistServiceImpl.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public JsonNode saveVideo(String videoUrl, List<String> playlists, ResourceResolver resourceResolver) {
        Map<String, Object> response = new LinkedHashMap<>();
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                response.put("status", "failed");
                response.put("message", "Could not obtain JCR session");
                return objectMapper.convertValue(response, JsonNode.class);
            }

            log.info("Got Session with: {}", session.getUserID());

            Resource parentResource = resourceResolver.getResource(Constants.ROOT_FOLDER_PATH);

            if (parentResource == null) {
                log.info("Couldn't get resource: {}", Constants.ROOT_FOLDER_PATH);
                response.put("status", "failed");
                response.put("message", "Couldn't get resource: " + Constants.ROOT_FOLDER_PATH);
                return null;
            }

            String username = session.getUserID();

            log.info("This is username from session: {}", username);

            Resource userResource = PlaylistMetadataUtils.getResource(parentResource, username);

            boolean atLeastOneAdded = false;
            boolean alreadyPresent = false;

            for (String playlistName : playlists) {
                Resource playlistResource = userResource.getChild(playlistName);

                if (playlistResource == null) {
                    log.warn("Playlist '{}' not found for user '{}'", playlistName, username);
                    continue;
                }

                ModifiableValueMap properties = playlistResource.adaptTo(ModifiableValueMap.class);
                if (properties == null) {
                    log.warn("Could not modify properties for playlist '{}'", playlistName);
                    continue;
                }

                String[] existingUrls = properties.get("videoUrls", String[].class);
                List<String> videoUrls = new ArrayList<>();

                if (existingUrls != null) {
                    if (existingUrls.length == 3) {
                        response.put("status", "failed");
                        response.put("message", "Playlist Limit Exceeded");
                        return objectMapper.convertValue(response, JsonNode.class);
                    }
                    videoUrls.addAll(Arrays.asList(existingUrls));
                }

                if (!videoUrls.contains(videoUrl)) {
                    videoUrls.add(videoUrl);
                    properties.put("videoUrls", videoUrls.toArray(new String[0]));

                    log.info("Added videoUrl '{}' to playlist '{}'", videoUrl, playlistName);
                    atLeastOneAdded = true;
                } else {
                    log.info("Video URL '{}' is already present in playlist '{}'", videoUrl, playlistName);
                    alreadyPresent = true;
                }
            }

            resourceResolver.commit();

            session.save();
            if (atLeastOneAdded) {
                response.put("status", "success");
                response.put("message", alreadyPresent ? "Some duplicates skipped" : "Successfully added to all");
            } else {
                response.put("status", "failed");
                response.put("message", "Video already exists");
            }
        } catch (Exception e) {
            log.error("Unexpected exception", e);
            response.put("status", "failed");
            response.put("message", "Unexpected exception: " + e.getMessage());
        }
        return objectMapper.convertValue(response, JsonNode.class);
    }

    @Override
    public JsonNode deleteVideo(String playlistName, String videoUrl, ResourceResolver resolver) {
        Map<String, Object> response = new LinkedHashMap<>();
        try {
            playlistName = playlistName.replace("\"", "");
            videoUrl = videoUrl.replace("\"", "");
            Session session = resolver.adaptTo(Session.class);
            if (session == null) {
                response.put("status", "failed");
                response.put("message", "Could not obtain JCR session");
                return objectMapper.convertValue(response, JsonNode.class);
            }
            String username = session.getUserID();
            Node rootNode = session.getNode(Constants.ROOT_FOLDER_PATH);
            Node userNode = PlaylistMetadataUtils.getNode(rootNode, username);
            if (!userNode.hasNode(playlistName)) {
                response.put("status", "failed");
                response.put("message", "Playlist " + playlistName + " does not exist for user " + username);
                return objectMapper.convertValue(response, JsonNode.class);
            }
            Node playlistNode = userNode.getNode(playlistName);
            if (!playlistNode.hasProperty("videoUrls")) {
                response.put("status", "failed");
                response.put("message", "No videoUrls property found in playlist " + playlistName);
                return objectMapper.convertValue(response, JsonNode.class);
            }
            Value[] values = playlistNode.getProperty("videoUrls").getValues();
            List<String> videoUrls = new ArrayList<>();
            boolean removed = false;
            for (Value value : values) {
                String url = value.getString().trim();
                if (!url.equalsIgnoreCase(videoUrl)) {
                    videoUrls.add(url);
                } else {
                    removed = true;
                }
            }
            if (!removed) {
                response.put("status", "failed");
                response.put("message", "Video URL not found in playlist: " + videoUrl);
                return objectMapper.convertValue(response, JsonNode.class);
            }
            playlistNode.setProperty("videoUrls", videoUrls.toArray(new String[0]));
            session.save();
            log.info("Successfully removed video URL '{}' from playlist '{}' for user '{}'", videoUrl, playlistName, username);
            response.put("status", "success");
            response.put("message", "Video removed from playlist" + playlistName + " successfully.");
            return objectMapper.convertValue(response, JsonNode.class);
        } catch (Exception e) {
            log.error("Unexpected error while deleting video from playlist", e);
            response.put("status", "failed");
            response.put("message", "Unexpected error: " + e.getMessage());
        }
        return objectMapper.convertValue(response, JsonNode.class);
    }

/*    @Override
    public JsonNode playlistNames(ResourceResolver resourceResolver) {
        Map<String, Object> response = new LinkedHashMap<>();
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                log.error("Could not obtain JCR session");
                response.put("status", "failed");
                response.put("message", "Could not obtain JCR session");
                return objectMapper.convertValue(response, JsonNode.class);
            }
            String username = session.getUserID();
            log.info("This is username: {}", username);
            if (!session.nodeExists(Constants.ROOT_FOLDER_PATH)) {
                log.error("Root folder does not exist: {}", Constants.ROOT_FOLDER_PATH);
                response.put("status", "failed");
                response.put("message", "Root folder not found at the specified location. Please check the configured path.");
                return objectMapper.convertValue(response, JsonNode.class);
            }
            Node rootNode = session.getNode(Constants.ROOT_FOLDER_PATH);
            Node userNode = PlaylistMetadataUtils.getOrCreateNode(rootNode, username);
            session.save();
            List<String> playlistNames = new ArrayList<>();
            NodeIterator iterator = userNode.getNodes();
            while (iterator.hasNext()) {
                Node playlistNode = iterator.nextNode();
                playlistNames.add(playlistNode.getName());
            }
            response.put("status", "success");
            response.put("playlistNames", playlistNames);
            return objectMapper.convertValue(response, JsonNode.class);
        } catch (Exception e) {
            log.error("Unexpected exception while retrieving playlists", e);
            response.put("status", "failed");
            response.put("message", "Exception: " + e.getMessage());
        }
        return objectMapper.convertValue(response, JsonNode.class);
    }*/


    @Override
    public JsonNode playlistNames(ResourceResolver resourceResolver) {
        Map<String, Object> response = new LinkedHashMap<>();

        try {
            if (resourceResolver == null) {
                log.error("ResourceResolver is null.");
                response.put("status", "failed");
                response.put("message", "Unable to access content repository.");
                return objectMapper.convertValue(response, JsonNode.class);
            }

            String username = resourceResolver.getUserID();
            log.info("Current user: {}", username);

            Resource rootResource = resourceResolver.getResource(Constants.ROOT_FOLDER_PATH);
            if (rootResource == null) {
                log.error("Root folder not found at path: {}", Constants.ROOT_FOLDER_PATH);
                response.put("status", "failed");
                response.put("message", "Root folder not found. Check configured path.");
                return objectMapper.convertValue(response, JsonNode.class);
            }

            // Get or create user-specific resource
            Resource userResource = PlaylistMetadataUtils.getOrCreateResource(rootResource, username, resourceResolver);
            if (userResource == null) {
                log.error("Failed to retrieve or create user resource under root path.");
                response.put("status", "failed");
                response.put("message", "Could not access or create user resource.");
                return objectMapper.convertValue(response, JsonNode.class);
            }

            List<String> playlistNames = new ArrayList<>();

            Iterable<Resource> children = userResource.getChildren();
            for (Resource playlistResource : children) {
                playlistNames.add(playlistResource.getName());
                log.debug("Found playlist: {}", playlistResource.getName());
            }

            log.info("Retrieved {} playlists for user '{}'", playlistNames.size(), username);

            response.put("status", "success");
            response.put("playlistNames", playlistNames);

            if (resourceResolver.hasChanges()) {
                resourceResolver.commit();
                log.debug("Changes committed to repository.");
            }

        }
        catch (Exception e) {
            log.error("Unexpected exception while retrieving playlists", e);
            response.put("status", "failed");
            response.put("message", "Exception: " + e.getMessage());
        }

        return objectMapper.convertValue(response, JsonNode.class);
    }


    @Override
    public JsonNode playlistsData(ResourceResolver resourceResolver) {
        Map<String, Object> response = new LinkedHashMap<>();
        List<Map<String, Object>> playlistsData = new ArrayList<>();
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                response.put("status", "failed");
                response.put("message", "Could not obtain JCR session");
                return objectMapper.convertValue(response, JsonNode.class);
            }
            String username = session.getUserID();
            if (!session.nodeExists(Constants.ROOT_FOLDER_PATH)) {
                response.put("status", "failed");
                response.put("message", "Root folder not found at the specified location. Please check the configured path.");
                return objectMapper.convertValue(response, JsonNode.class);
            }
            Node rootNode = session.getNode(Constants.ROOT_FOLDER_PATH);
            Node userNode = PlaylistMetadataUtils.getNode(rootNode, username);
            if (userNode == null) {
                response.put("status", "failed");
                response.put("message", "You currently have no playlists. Please create a playlist to get started");
                return objectMapper.convertValue(response, JsonNode.class);
            }
            NodeIterator iterator = userNode.getNodes();
            if (!iterator.hasNext()) {
                response.put("status", "failed");
                response.put("message", "You currently have no playlists. Please create a playlist to get started");
                return objectMapper.convertValue(response, JsonNode.class);
            }
            while (iterator.hasNext()) {
                Node playlistNode = iterator.nextNode();
                String playlistName = playlistNode.getName();
                List<String> videoUrls = new ArrayList<>();
                if (playlistNode.hasProperty("videoUrls")) {
                    Value[] values = playlistNode.getProperty("videoUrls").getValues();
                    for (Value value : values) {
                        videoUrls.add(value.getString().trim());
                    }
                }
                Map<String, Object> playlistEntry = new LinkedHashMap<>();
                playlistEntry.put(playlistName, videoUrls);
                playlistsData.add(playlistEntry);
            }
            response.put("status", "success");
            response.put("message", "Playlists data retrieved successfully");
            response.put("playlistData", playlistsData);

            return objectMapper.convertValue(response, JsonNode.class);
        } catch (Exception ex) {
            response.put("status", "failed");
            response.put("message", "Exception occurred: " + ex.getMessage());
            return objectMapper.convertValue(response, JsonNode.class);
        }
    }
}