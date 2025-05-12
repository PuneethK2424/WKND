package com.adobe.aem.guides.wknd.core.models;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;

public class ServletUtils {

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
        String []users=new String[]{"admin","kolhe.yamini@nextrow.com","ramanmishra@nextrow.com","ruchith.k@nextrow.com","puneeth.k@nextrow.com", "keertpx1","ruchithk","userMK","userRam","PlaylistUser","Sravanp"};
        for (String user : users) {
            if (user.equalsIgnoreCase(username)) {
                return true;
            }
        }
        return false;
    }
}