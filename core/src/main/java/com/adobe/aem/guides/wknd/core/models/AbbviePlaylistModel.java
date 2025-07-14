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
            logger.info("User login is successful.");
            return true;
        }
        catch (Exception exception) {
            logger.info("Error while user login-- not useful");
            return false;
        }
    }

    public List<Category> getCategories() {
        return categories;
    }
}
