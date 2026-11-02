package com.agence.voyage.dto;
import java.util.List;
public record ProfileOptions(List<Country> countries,long maxImageBytes,long maxPixels,int minDimension,int maxDimension){
    public record Country(String code,String name){}
}
