package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.JsonNode;
import org.apache.sling.api.resource.ResourceResolver;

import java.util.List;

public interface VideoPlaylistService {

    JsonNode saveVideo(String videoUrl, List<String> playlists, ResourceResolver resolver);

    JsonNode deleteVideo(String playlistName, String videoUrl, ResourceResolver originalResolver);

    JsonNode playlistNames(ResourceResolver resourceResolver);

    JsonNode playlistsData(ResourceResolver resourceResolver);
}