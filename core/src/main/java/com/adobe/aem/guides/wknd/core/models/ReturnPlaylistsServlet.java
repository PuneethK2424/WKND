package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletPaths;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.servlet.Servlet;
import java.io.IOException;

@Component(service = Servlet.class)
@SlingServletPaths(value = "/bin/aemascs/returnPlaylists")
public class ReturnPlaylistsServlet extends SlingSafeMethodsServlet {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Reference
    private VideoPlaylistService videoPlaylistService;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(),videoPlaylistService.returnPlaylists(request.getResourceResolver()));
    }

}
