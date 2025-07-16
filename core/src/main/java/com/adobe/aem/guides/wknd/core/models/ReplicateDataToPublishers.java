package com.adobe.aem.guides.wknd.core.models;

import com.day.cq.replication.ReplicationActionType;
import com.day.cq.replication.Replicator;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.Servlet;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component(service = Servlet.class,
        property = {
                "sling.servlet.paths=/wknd/components/abbvie-playlist/replicate-data.json",
                "sling.servlet.methods=POST"
        })
public class ReplicateDataToPublishers extends SlingAllMethodsServlet {

    private static final Logger log = LoggerFactory.getLogger(ReplicateDataToPublishers.class);
    private static final String CONTENT_PATH = "/conf/hcp-playlists";

    @Reference
    private Replicator replicator;

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> params = new HashMap<>();
        params.put(ResourceResolverFactory.SUBSERVICE, "playlistServiceUser");

        try (ResourceResolver resolver = resolverFactory.getServiceResourceResolver(params)) {
            Session session = resolver.adaptTo(Session.class);
            if (session != null) {
                log.info("Triggering replication for path: {}", CONTENT_PATH);
                replicator.replicate(session, ReplicationActionType.ACTIVATE, CONTENT_PATH);
                response.getWriter().write("{\"status\":\"success\", \"message\":\"Replication triggered.\"}");
            } else {
                log.error("Session is null while trying to replicate.");
                response.setStatus(500);
                response.getWriter().write("{\"status\":\"error\", \"message\":\"Session was null.\"}");
            }
        } catch (Exception e) {
            log.error("Replication failed", e);
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}");
        }
    }
}

