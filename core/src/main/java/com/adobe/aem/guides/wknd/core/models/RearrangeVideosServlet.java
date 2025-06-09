package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
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
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component(service = Servlet.class)
@SlingServletResourceTypes(resourceTypes = "wknd/components/abbvie-playlist", selectors = "rearrangeVideos", extensions = "json", methods = HttpConstants.METHOD_POST)
public class RearrangeVideosServlet extends SlingAllMethodsServlet {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        Map<String, String> userResponse = new HashMap<>();

        try {
            // Extract input data from request
            Map<String, Object> requestMap = RequestProcessingUtils.getInputs(request);
            if (requestMap == null) {
                logger.error("Failed to process Request");
                userResponse.put("status", "failed");
                userResponse.put("message", "Failed to process Request");
                response.getWriter().write(new Gson().toJson(userResponse));
                return;
            }

            String playlistName = requestMap.get("playlistName").toString();
            String[] playlistItems = objectMapper.convertValue(
                    requestMap.get("playlistItems"), new TypeReference<String[]>() {}
            );

            logger.info("Playlist-Name: {}", playlistName);

            ResourceResolver resourceResolver = request.getResourceResolver();
            logger.info("Current User: {}", resourceResolver.getUserID());

            rearrangePlaylist(playlistName, playlistItems, resourceResolver, userResponse);

            response.setHeader("Content-Type", "application/json");
            response.getWriter().write(new Gson().toJson(userResponse));
        } catch (Exception exception) {
            logger.error("Exception caught: {}", exception.getMessage());

            response.setHeader("Content-Type", "application/json");
            userResponse.put("status", "failed");
            userResponse.put("message", "Incorrect Specified Inputs.");
            response.getWriter().write(new Gson().toJson(userResponse));
        }
    }

    private void rearrangePlaylist(String playlistName, String[] playlistItems, ResourceResolver resourceResolver, Map<String, String> userResponse) {
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                logger.error("Session is null");
                userResponse.put("status", "failed");
                userResponse.put("message", "Could not retrieve session from ResourceResolver.");
                return;
            }

            String username = session.getUserID();
            Node rootFolderNode = session.getNode(Constants.ROOT_FOLDER_PATH);
            logger.info("Root folder path: {}", rootFolderNode.getPath());

            Node userSpecificNode = PlaylistMetadataUtils.getOrCreateNode(rootFolderNode, username);
            Node playlistNode = PlaylistMetadataUtils.getNode(userSpecificNode, playlistName);

            if (playlistNode == null) {
                logger.error("Playlist '{}' doesn't exist", playlistName);
                userResponse.put("status", "failed");
                userResponse.put("message", "Playlist " + playlistName + " doesn't exist.");
                return;
            }

            playlistNode.setProperty("videoUrls", playlistItems);
            session.save();

            logger.info("Playlist Rearranged: {}", playlistNode.getPath());
            userResponse.put("status", "success");
            userResponse.put("message", "Playlist " + playlistName + " rearranged successfully.");
        } catch (Exception exception) {
            logger.error("Exception caught while rearranging playlist: {}", exception.getMessage());
            userResponse.put("status", "failed");
            userResponse.put("message", "Error while rearranging playlist: " + exception.getMessage());
        }
    }
}