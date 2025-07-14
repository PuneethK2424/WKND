package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class HttpClientUtils {
    private static final CloseableHttpClient httpClient = HttpClients.createDefault();
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger log = LoggerFactory.getLogger(HttpClientUtils.class);

    // Http GET Connection
    public static JsonNode executeGetRequest(HttpGet httpGet) {
        try {
            CloseableHttpResponse response = httpClient.execute(httpGet);
            String responseData = EntityUtils.toString(response.getEntity());
            response.close();
            return objectMapper.readTree(responseData);
        } catch (Exception exception) {
            return null;
        }
    }

    public static JsonNode httpGetResponse(String connectionUrl, Map<String, String> headers) {
        try {
            HttpGet httpGet = new HttpGet(connectionUrl);
            for (String headerKey : headers.keySet()) {
                httpGet.setHeader(headerKey, headers.get(headerKey));
            }
            return executeGetRequest(httpGet);
        } catch (Exception exception) {
            return null;
        }
    }

    // Http Post Connection
    public static JsonNode executePostRequest(HttpPost httpPost) {
        try {
            CloseableHttpResponse response = httpClient.execute(httpPost);
            String responseData = EntityUtils.toString(response.getEntity());
            log.info("Post resp: {}",responseData);
            response.close();
            return objectMapper.readTree(responseData);
        } catch (Exception exception) {
            return null;
        }
    }

    public static JsonNode httpPostResponse(String connectionUrl, String jsonDataString, Map<String, String> headers) {
        try {
            HttpEntity httpEntity = new StringEntity(jsonDataString);
            HttpPost httpPost = new HttpPost(connectionUrl);
            for (String headerKey : headers.keySet()) {
                httpPost.setHeader(headerKey, headers.get(headerKey));
            }
            httpPost.setEntity(httpEntity);
            log.info("This is req: {}", httpPost);
            return executePostRequest(httpPost);
        } catch (Exception exception) {
            return null;
        }
    }
}