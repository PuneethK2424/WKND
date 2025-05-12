package com.adobe.aem.guides.wknd.core.models;

import javax.jcr.Node;

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
