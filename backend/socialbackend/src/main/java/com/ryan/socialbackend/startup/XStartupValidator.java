package com.ryan.socialbackend.startup;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.ryan.socialbackend.services.XService;

@Component
public class XStartupValidator implements ApplicationRunner {

    private final XService xService;

    public XStartupValidator(XService xService) {
        this.xService = xService;
    }

    @Override
    public void run(ApplicationArguments args) {
        System.out.println("Validating X token on startup...");

        boolean valid = xService.validateStoredToken();

        if (valid) {
            System.out.println("X token valid");
        } else {
            System.out.println("X token invalid — user logged out");
        }
    }
}