package com.adobe.aem.guides.wknd.core.models;

import com.day.cq.commons.jcr.JcrConstants;
import org.apache.jackrabbit.api.JackrabbitSession;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import java.util.HashMap;
import java.util.Map;

public class PlaylistStorageUtils {

    private static final Logger log = LoggerFactory.getLogger(PlaylistStorageUtils.class);

    private static final String HOME_USER_PATH="/home/users/D/DgsNDqfgQhBzqBWSuKUf/profile";

    public static Resource getHCPProfileResource(ResourceResolver resourceResolver, String userId) {
        try {
            Resource userResource=resourceResolver.getResource(HOME_USER_PATH);
            if (userResource==null){
                log.info("No {} path", HOME_USER_PATH);
                return null;
            }
            return userResource;
        } catch (Exception e) {
            log.error("Unexpected error while Fetching HCP Profile Resource  '{}'", userId, e);
            return null;
        }
    }

    public static Resource getOrCreateBucketFolder(ResourceResolver resolver, Resource hcpProfileResource, String playlistName) throws PersistenceException {
        String bucketFolderName = getBucketFolderName(playlistName);

        String bucketFolderPath = hcpProfileResource.getPath() + "/" + bucketFolderName;
        Resource bucketFolder = resolver.getResource(bucketFolderPath);

        if (bucketFolder == null) {
            log.info("Bucket folder '{}' does not exist. Creating new folder at '{}'", bucketFolderName, bucketFolderPath);
            Map<String, Object> props = new HashMap<>();
            props.put(JcrConstants.JCR_PRIMARYTYPE, "sling:Folder");

            bucketFolder = resolver.create(hcpProfileResource, bucketFolderName, props);
            resolver.commit();
            log.info("Bucket folder '{}' created at '{}'", bucketFolderName, bucketFolderPath);
        } else {
            log.info("Bucket folder '{}' already exists at '{}'", bucketFolderName, bucketFolderPath);
        }
        return bucketFolder;
    }

    public static Resource getOrCreatePlaylist(ResourceResolver resolver, Resource bucketFolder, String playlistName) throws PersistenceException {
        String playlistPath = bucketFolder.getPath() + "/" + playlistName;
        log.info("Checking for existing playlist at path: {}", playlistPath);

        Resource playlistResource = resolver.getResource(playlistPath);

        if (playlistResource == null) {
            log.info("Playlist '{}' not found under '{}'. Creating new resource.", playlistName, bucketFolder.getPath());

            Map<String, Object> props = new HashMap<>();
            props.put(JcrConstants.JCR_PRIMARYTYPE, "nt:unstructured");
            props.put("customProp", "value");

            playlistResource = resolver.create(bucketFolder, playlistName, props);
            log.info("Created playlist path: {}", playlistResource.getPath());
            resolver.commit();

            log.info("Playlist '{}' created at '{}'", playlistName, playlistResource.getPath());
        } else {
            log.info("Playlist '{}' already exists at '{}'", playlistName, playlistResource.getPath());
        }

        return playlistResource;
    }


    public static String getBucketFolderName(String playlistName) {
        String bucket = String.valueOf(playlistName.charAt(0));
        log.info("Bucket folder: {}", bucket);
        return bucket;
    }

}