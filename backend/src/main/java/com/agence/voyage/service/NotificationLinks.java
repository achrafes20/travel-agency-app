package com.agence.voyage.service;
import com.agence.voyage.exception.BusinessException;
import java.net.URI;
public final class NotificationLinks {
 private NotificationLinks(){}
 public static String validate(String link){
  if(link==null)return null;
  try {
   if(link.length()>500||link.matches(".*[\\\\\\s<>\\\"'].*"))throw new IllegalArgumentException();
   URI uri=URI.create(link);
   String path=uri.getPath();
   if(uri.isAbsolute()||uri.getRawAuthority()!=null||path==null||path.startsWith("//")||path.contains("\\"))
    throw new IllegalArgumentException();
   if(!path.startsWith("/")&&!path.matches("(frontend/)?((admin|supplier|agent|client)/index|accueil|catalogue|offre|panier|connexion)\\.html"))
    throw new IllegalArgumentException();
   if(path.contains(".."))throw new IllegalArgumentException();
   return link;
  }catch(IllegalArgumentException ex){throw new BusinessException("Lien de notification interne invalide");}
 }
}
