package com.adobe.aem.guides.wknd.core.models;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ChildResource;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.jcr.Session;
import java.util.List;

@Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class AbbviePlaylistModel {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @ChildResource
    private List<Category> categories;

    @Inject
    private ResourceResolver resourceResolver;


    @ValueMapValue
    private String componentTitle;

    @ValueMapValue
    private String componentDescription;


    public String getComponentDescription() {
        return componentDescription;
    }

    public String getComponentTitle() {
        return componentTitle;
    }

    public boolean validateUser(){
        try {
            Session session = resourceResolver.adaptTo(Session.class);
            if (session == null) {
                return false;
            }
            String username = session.getUserID();
            logger.info("Current User: {}",username);
            return ServletUtils.checkUser(username);
        }
        catch (Exception exception) {
            return false;
        }
    }

    public List<Category> getCategories() {
        return categories;
    }
}
