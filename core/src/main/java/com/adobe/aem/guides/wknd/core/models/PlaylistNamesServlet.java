package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import java.io.IOException;

@Component(service = Servlet.class,
        property = {
                "sling.servlet.paths=/wknd/components/abbvie-playlist/playlist-names.json",
                "sling.servlet.methods=GET"
        })
public class PlaylistNamesServlet extends SlingSafeMethodsServlet {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger log = LoggerFactory.getLogger(PlaylistNamesServlet.class);


    @Reference
    private VideoPlaylistService videoPlaylistService;

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        log.info("Received request");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(),videoPlaylistService.playlistNames(ResourceResolverUtils.getResourceResolver(resourceResolverFactory)));
    }

}
