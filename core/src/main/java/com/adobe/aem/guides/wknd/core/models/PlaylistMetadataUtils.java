package com.adobe.aem.guides.wknd.core.models;

import com.day.cq.commons.jcr.JcrConstants;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import javax.jcr.Node;
import java.util.HashMap;
import java.util.Map;

public class PlaylistMetadataUtils {



    public static Node getOrCreateFolder(Node parent, String folderName) throws Exception {
        return parent.hasNode(folderName) ? parent.getNode(folderName) : parent.addNode(folderName, "sling:Folder");
    }

    public static Node getNode(Node userNode, String playlistName) throws Exception {
        return userNode.hasNode(playlistName)
                ? userNode.getNode(playlistName)
                : null;
    }

    public static Node getOrCreateNode(Node userNode, String playlistName) throws Exception {
        return userNode.hasNode(playlistName)
                ? userNode.getNode(playlistName)
                : userNode.addNode(playlistName, "nt:unstructured");
    }


    // Returns an existing resource or null
    public static Resource getResource(Resource userResource, String playlistName) {
        if (userResource == null || playlistName == null) {
            return null;
        }
        return userResource.getChild(playlistName);
    }

    // Returns an existing resource or creates it
    public static Resource getOrCreateResource(Resource userResource, String playlistName, ResourceResolver resourceResolver) {
        if (userResource == null || playlistName == null) {
            return null;
        }

        Resource child = userResource.getChild(playlistName);
        if (child != null) {
            return child;
        }

        try {
            Map<String, Object> props = new HashMap<>();
            props.put(JcrConstants.JCR_PRIMARYTYPE, "nt:unstructured");

            return resourceResolver.create(userResource, playlistName, props);
        } catch (Exception e) {
            return null;
        }
    }


    public static Node createPlaylistNode(Node userNode, String playlistName) throws Exception {
        return userNode.hasNode(playlistName)
                ? null
                : userNode.addNode(playlistName, "nt:unstructured");
    }

    public static boolean deleteNode(Node userSpecificNode, String playlistName) throws Exception {
        if (userSpecificNode.hasNode(playlistName)){
            Node playlist=userSpecificNode.getNode(playlistName);
            playlist.remove();
            return true;
        }
        return false;
    }
}
