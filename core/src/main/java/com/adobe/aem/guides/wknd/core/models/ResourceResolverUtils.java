package com.adobe.aem.guides.wknd.core.models;

import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

public class ResourceResolverUtils {

    private static final Logger log = LoggerFactory.getLogger(ResourceResolverUtils.class);

    public static  ResourceResolver getResourceResolver(ResourceResolverFactory resolverFactory) {
        Map<String, Object> params = new HashMap<>();
        params.put(ResourceResolverFactory.SUBSERVICE, "playlistServiceUser");

        try {
            log.info("Attempting to get a service resource resolver using subservice: playlistServiceUser");
            ResourceResolver resolver = resolverFactory.getServiceResourceResolver(params);
            log.info("Successfully obtained a service resource resolver.");
            return resolver;
        } catch (LoginException e) {
            log.error("LoginException occurred while obtaining service resource resolver for subservice: playlistServiceUser", e);
        } catch (Exception e) {
            log.error("Unexpected exception occurred while obtaining resource resolver", e);
        }

        return null;
    }
}
