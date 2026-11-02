package com.agence.voyage.dto;
import com.agence.voyage.entity.*;
public record FileResponse(String id,String url,String thumbnailUrl,int width,int height,long size,String contentType,FilePurpose purpose){}
