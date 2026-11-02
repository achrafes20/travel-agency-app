package com.agence.voyage.event;
public record AccountMailEvent(String to,String subject,String html,String text) {}
