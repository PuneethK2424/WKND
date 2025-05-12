package com.adobe.aem.guides.wknd.core.models;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.apache.sling.models.annotations.injectorspecific.ChildResource;

import java.util.List;

@Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class Category {

    @ValueMapValue
    private String categoryName;

    @ChildResource
    private List<Question> questions;

    public String getCategoryName() {
        return categoryName;
    }

    public List<Question> getQuestions() {
        return questions;
    }
}
