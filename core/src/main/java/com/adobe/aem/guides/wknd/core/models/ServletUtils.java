package com.adobe.aem.guides.wknd.core.models;

import com.day.cq.replication.Replicator;
import com.fasterxml.jackson.databind.JsonNode;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ServletUtils {

    @Reference
    public Replicator replicator;

    private static final Logger log = LoggerFactory.getLogger(PublishAddVideoServlet.class);

    public static void forwardRequest(SlingHttpServletRequest request, SlingHttpServletResponse response, String targetUrl) throws IOException {
        try {
            String payload = getRequestBodyAsString(request);
            log.info("Forwarding payload to Author URL {}: {}", targetUrl, payload);

            Map<String, String> headers = new HashMap<>();

            String auth = "userRam:userRam";
            String encodedAuth = java.util.Base64.getEncoder().encodeToString(auth.getBytes("UTF-8"));
            headers.put("Authorization", "Basic " + encodedAuth);

            JsonNode authorResponse = HttpClientUtils.httpPostResponse(targetUrl, payload, headers);

            log.info("Response received from author is: {}",authorResponse);

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            if (authorResponse != null) {
                response.getWriter().write(authorResponse.toString());
            } else {
                response.getWriter().write("{\"error\": \"Failed to get response from Author servlet\"}");
            }
        } catch (Exception e) {
            log.error("Error forwarding request to Author servlet", e);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"Forwarding failed: " + e.getMessage() + "\"}");
        }
    }

    public static void forwardGetRequest(SlingHttpServletRequest request, SlingHttpServletResponse response, String targetUrl) throws IOException {
        try {
            String payload = getRequestBodyAsString(request);
            log.info("Forwarding payload, Author URL {}: {}", targetUrl, payload);

            Map<String, String> headers = new HashMap<>();

            String auth = "userRam:userRam";
            String encodedAuth = java.util.Base64.getEncoder().encodeToString(auth.getBytes("UTF-8"));
            headers.put("Authorization", "Basic " + encodedAuth);

            JsonNode authorResponse = HttpClientUtils.httpGetResponse(targetUrl, headers);

            log.info("Response received from author is: {}",authorResponse);

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            if (authorResponse != null) {
                response.getWriter().write(authorResponse.toString());
            } else {
                response.getWriter().write("{\"error\": \"Failed to get response from Author servlet\"}");
            }
        } catch (Exception e) {
            log.error("Error forwarding request to Author servlet", e);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"Forwarding failed: " + e.getMessage() + "\"}");
        }
    }


    public static void replicateDataToPublish(String REPLICATE_URL, String payload){
        try{
            log.info("Replicating Data from Author URL {}: {}", REPLICATE_URL, payload);

            Map<String, String> headers = new HashMap<>();

            String auth = "userRam:userRam";
            String encodedAuth = java.util.Base64.getEncoder().encodeToString(auth.getBytes("UTF-8"));
            headers.put("Authorization", "Basic " + encodedAuth);
            JsonNode replicationResponse = HttpClientUtils.httpPostResponse(REPLICATE_URL, payload, headers);

            log.info("Replication done successfully: {}", replicationResponse);
        }
        catch (Exception exception){
            log.info("Error caught while replicating data to publisher.");
            log.info("Message: {}", exception.getMessage());
        }
    }



    public static String getRequestBodyAsString(HttpServletRequest request) throws IOException {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        }
        return builder.toString();
    }

    public static boolean checkUser(String username){
        String []users=new String[]{"admin","kolhe.yamini@nextrow.com","ramanmishra@nextrow.com","ruchith.k@nextrow.com"};
        for (String user : users) {
            if (user.equalsIgnoreCase(username)) {
                return true;
            }
        }
        return false;
    }
}