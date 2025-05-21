package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.Session;
import javax.jcr.Value;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

            if (!session.nodeExists(Constants.ROOT_FOLDER_PATH)) {
                response.put("status", "failed");
                response.put("message", "Root folder path does not exist: " + Constants.ROOT_FOLDER_PATH);
                return objectMapper.convertValue(response, JsonNode.class);
            }

            Node parentNode = session.getNode(Constants.ROOT_FOLDER_PATH);
            String username = session.getUserID();

            Node userNode = PlaylistMetadataUtils.getNode(parentNode, username);

            boolean atLeastOneAdded = false;
            boolean alreadyPresent = false;

            for (String playlistName : playlists) {
                if (!userNode.hasNode(playlistName)) {
                    log.warn("Playlist '{}' not found for user '{}'", playlistName, username);
                    continue;
                }

                Node playlistNode = userNode.getNode(playlistName);

                List<String> videoUrls = new ArrayList<>();
                if (playlistNode.hasProperty("videoUrls")) {
                    Value[] values = playlistNode.getProperty("videoUrls").getValues();
                    if (values.length == 3) {
                        response.put("status", "failed");
                        response.put("message", "maximum limit exceeded");
                        return objectMapper.convertValue(response, JsonNode.class);
                    }
                    for (Value value : values) {
                        videoUrls.add(value.getString());
                    }
                }

                if (!videoUrls.contains(videoUrl)) {
                    videoUrls.add(videoUrl);
                    playlistNode.setProperty("videoUrls", videoUrls.toArray(new String[0]));
                    log.info("Added videoUrl '{}' to playlist '{}'", videoUrl, playlistName);
                    atLeastOneAdded = true;
                } else {
                    log.info("Video URL '{}' is already present in playlist '{}'", videoUrl, playlistName);
                    alreadyPresent = true;
                }
            }

            session.save();

            if (atLeastOneAdded) {
                response.put("status", "success");
                response.put("message", alreadyPresent ?
                        "Video added to some playlists, but already existed in others." :
                        "Video added successfully to all playlists.");
            } else {
                response.put("status", "failed");
                response.put("message", "Video already exists in all specified playlists.");
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
            if (!session.nodeExists(Constants.ROOT_FOLDER_PATH)) {
                response.put("status", "failed");
                response.put("message", "Root folder path does not exist: " + Constants.ROOT_FOLDER_PATH);
                return objectMapper.convertValue(response, JsonNode.class);
            }

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


    @Override
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
            if (!session.nodeExists(Constants.ROOT_FOLDER_PATH)) {
                log.error("Root folder does not exist: {}", Constants.ROOT_FOLDER_PATH);
                response.put("status", "failed");
                response.put("message", "Root folder does not exist: " + Constants.ROOT_FOLDER_PATH);
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
                response.put("message", "Root folder does not exist: " + Constants.ROOT_FOLDER_PATH);
                return objectMapper.convertValue(response, JsonNode.class);
            }

            Node rootNode = session.getNode(Constants.ROOT_FOLDER_PATH);
            Node userNode = PlaylistMetadataUtils.getNode(rootNode, username);
            if (userNode == null) {
                response.put("status", "failed");
                response.put("message", "no playlists found for the user " + username);
                return objectMapper.convertValue(response, JsonNode.class);
            }

            NodeIterator iterator = userNode.getNodes();
            if (!iterator.hasNext()) {
                response.put("status", "failed");
                response.put("message", "no playlists found for the user " + username);
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
            response.put("message", "playlists data retrieved successfully");
            response.put("playlistData", playlistsData);
            return objectMapper.convertValue(response, JsonNode.class);
        } catch (Exception ex) {
            response.put("status", "failed");
            response.put("message", "Exception occurred: " + ex.getMessage());
            return objectMapper.convertValue(response, JsonNode.class);
        }
    }
}