package com.adobe.aem.guides.wknd.core.models;

import com.day.cq.replication.ReplicationActionType;
import com.day.cq.replication.Replicator;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.Servlet;
import java.io.IOException;

@Component(service = Servlet.class,
        property = {
                "sling.servlet.paths=/aemascs/components/abbvie-playlist/send-data-to-author.json",
                "sling.servlet.methods=POST"
        })
public class PublishAddVideoServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(PublishAddVideoServlet.class);
    private static final String AUTHOR_URL = "https://author-p63260-e524717.adobeaemcloud.com/aemascs/components/abbvie-playlist/add-video.json";

    @Reference
    private Replicator replicator;

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        log.info("Servlet triggered from SendDataToAuthor in Publish mode");

        ServletUtils.forwardRequest(request, response, AUTHOR_URL);
        // replicate to publish
        //ResourceResolver resourceResolver = request.getResourceResolver();
        //replicateToPublish(resourceResolver, "/conf/hcp-playlists");
    }

    public void replicateToPublish(ResourceResolver resolver, String path) {

        try {
            log.info("replication triggered");
            replicator.replicate(resolver.adaptTo(Session.class), ReplicationActionType.ACTIVATE, path);
            log.info("replication done");
        } catch (Exception exception) {
            log.error("caught error while replicating");
            log.info("Message: {}", exception.getMessage());
        }
    }

}