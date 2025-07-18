package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.servlet.Servlet;
import java.io.IOException;

@Component(service = Servlet.class)
@SlingServletResourceTypes(resourceTypes = "wknd/components/abbvie-playlist", selectors = "playlistsData", extensions = "json", methods = HttpConstants.METHOD_GET)
public class PlaylistsDataServlet extends SlingSafeMethodsServlet {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    @Reference
    private VideoPlaylistService videoPlaylistService;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), videoPlaylistService.playlistsData(request.getResourceResolver()));
    }
}