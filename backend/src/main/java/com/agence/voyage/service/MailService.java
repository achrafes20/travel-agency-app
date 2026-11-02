package com.agence.voyage.service;
/** Transport des e-mails de sécurité, séparé des règles métier et des jetons. */
public interface MailService { void send(String to,String subject,String html,String text); }
