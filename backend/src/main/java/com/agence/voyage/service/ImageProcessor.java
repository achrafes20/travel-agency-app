package com.agence.voyage.service;

import com.agence.voyage.config.UploadProperties;
import com.agence.voyage.exception.*;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.exif.ExifIFD0Directory;
import org.springframework.stereotype.Component;
import javax.imageio.*;
import javax.imageio.stream.*;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.CRC32;

/** Validation du conteneur, lecture bornée, puis réencodage sans métadonnées. */
@Component
public class ImageProcessor {
    public record Processed(byte[] original,byte[] thumbnail,int width,int height,String extension,String contentType){}
    private final UploadProperties properties;
    public ImageProcessor(UploadProperties properties){this.properties=properties;ImageIO.scanForPlugins();}
    public Processed process(byte[] bytes){
        try{
            String kind=container(bytes);rejectSecondaryPayload(bytes);
            try(ImageInputStream input=ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))){
                Iterator<ImageReader> readers=ImageIO.getImageReaders(input);if(!readers.hasNext())throw invalid("Image illisible");
                ImageReader reader=readers.next();BufferedImage source;
                try{
                    reader.setInput(input,true,true);int width=reader.getWidth(0),height=reader.getHeight(0);
                    if(width<200||height<200||width>6000||height>6000||(long)width*height>properties.maxPixels())throw invalid("Dimensions attendues : au moins 200 × 200, au plus 6000 × 6000 et "+properties.maxPixels()+" pixels");
                    source=reader.read(0);if(source==null)throw invalid("Image illisible");
                }finally{reader.dispose();}
                source=orient(source,orientation(bytes));boolean alpha=source.getColorModel().hasAlpha();String ext=alpha?"png":"jpg";
                BufferedImage original=resize(source,1920,alpha),thumbnail=resize(source,480,alpha);
                return new Processed(encode(original,ext),encode(thumbnail,ext),original.getWidth(),original.getHeight(),ext,alpha?"image/png":"image/jpeg");
            }
        }catch(BusinessException ex){throw ex;}catch(Exception ex){throw invalid("Le fichier n'est pas une image JPEG, PNG ou WebP valide");}
    }
    private BusinessException invalid(String message){return new BusinessException(ErrorCode.INVALID_IMAGE,message);}
    private String container(byte[] b){
        if(b.length>=4&&(b[0]&255)==255&&(b[1]&255)==216&&(b[2]&255)==255){jpeg(b);return "jpeg";}
        if(b.length>=8&&Arrays.equals(Arrays.copyOf(b,8),new byte[]{(byte)137,80,78,71,13,10,26,10})){png(b);return "png";}
        if(b.length>=12&&new String(b,0,4,StandardCharsets.US_ASCII).equals("RIFF")&&new String(b,8,4,StandardCharsets.US_ASCII).equals("WEBP")){
            long size=Integer.toUnsignedLong(ByteBuffer.wrap(b,4,4).order(ByteOrder.LITTLE_ENDIAN).getInt());if(size+8!=b.length)throw invalid("Conteneur WebP incohérent");
            int p=12;boolean image=false;
            while(p<b.length){if(p+8>b.length)throw invalid("Conteneur WebP incomplet");String type=new String(b,p,4,StandardCharsets.US_ASCII);long length=Integer.toUnsignedLong(ByteBuffer.wrap(b,p+4,4).order(ByteOrder.LITTLE_ENDIAN).getInt());
                if(!Set.of("VP8 ","VP8L","VP8X","ALPH","EXIF","ICCP","XMP ").contains(type))throw invalid("WebP animé ou bloc non autorisé");
                image|=type.equals("VP8 ")||type.equals("VP8L");long next=p+8L+length+(length&1);if(next>b.length)throw invalid("WebP incomplet");p=(int)next;}
            if(!image)throw invalid("WebP sans image");return "webp";
        }
        throw invalid("Formats autorisés : JPEG, PNG et WebP. SVG, GIF et documents refusés");
    }
    private void jpeg(byte[] b){
        int p=2;
        while(p<b.length){if((b[p++]&255)!=255)throw invalid("JPEG incohérent");while(p<b.length&&(b[p]&255)==255)p++;if(p>=b.length)break;int marker=b[p++]&255;
            if(marker==217){if(p!=b.length)throw invalid("Données ajoutées après l'image");return;}
            if(marker==216||marker==0||p+2>b.length)throw invalid("JPEG incohérent");int length=((b[p]&255)<<8)|(b[p+1]&255);if(length<2||p+length>b.length)throw invalid("JPEG tronqué");p+=length;
            if(marker==218){while(p<b.length){if((b[p]&255)==255){if(p+1>=b.length)break;int next=b[p+1]&255;if(next==0||next>=208&&next<=215){p+=2;continue;}break;}p++;}}
        }
        throw invalid("Fin JPEG manquante");
    }
    private void png(byte[] b){
        int p=8;boolean first=true;
        while(p<b.length){if(p+12>b.length)throw invalid("PNG incomplet");long length=Integer.toUnsignedLong(ByteBuffer.wrap(b,p,4).getInt());long end=p+12L+length;if(end>b.length)throw invalid("PNG incohérent");
            String type=new String(b,p+4,4,StandardCharsets.US_ASCII);if(first&&(!type.equals("IHDR")||length!=13))throw invalid("En-tête PNG invalide");first=false;
            if(type.equals("acTL"))throw invalid("Les images animées ne sont pas acceptées");CRC32 crc=new CRC32();crc.update(b,p+4,(int)length+4);long expected=Integer.toUnsignedLong(ByteBuffer.wrap(b,p+8+(int)length,4).getInt());if(crc.getValue()!=expected)throw invalid("CRC PNG invalide");p=(int)end;
            if(type.equals("IEND")){if(length!=0||p!=b.length)throw invalid("Données ajoutées après l'image");return;}
        }throw invalid("Fin PNG manquante");
    }
    private void rejectSecondaryPayload(byte[] bytes){
        String text=new String(bytes,StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT);
        if(text.contains("<script")||text.contains("<html")||text.contains("<svg")||text.contains("<?php")||text.contains("%pdf-")||text.contains("pk\u0003\u0004"))throw invalid("Le fichier contient une charge secondaire non autorisée");
    }
    private int orientation(byte[] bytes){try{var metadata=ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));var exif=metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);return exif==null?1:exif.getInt(ExifIFD0Directory.TAG_ORIENTATION);}catch(Exception ex){return 1;}}
    static BufferedImage orient(BufferedImage source,int value){
        if(value<=1||value>8)return source;int w=source.getWidth(),h=source.getHeight();
        AffineTransform transform=switch(value){case 2->new AffineTransform(-1,0,0,1,w,0);case 3->new AffineTransform(-1,0,0,-1,w,h);case 4->new AffineTransform(1,0,0,-1,0,h);case 5->new AffineTransform(0,1,1,0,0,0);case 6->new AffineTransform(0,1,-1,0,h,0);case 7->new AffineTransform(0,-1,-1,0,h,w);default->new AffineTransform(0,-1,1,0,0,w);};
        BufferedImage target=new BufferedImage(value>=5?h:w,value>=5?w:h,source.getColorModel().hasAlpha()?BufferedImage.TYPE_INT_ARGB:BufferedImage.TYPE_INT_RGB);Graphics2D graphics=target.createGraphics();try{graphics.drawImage(source,transform,null);}finally{graphics.dispose();}return target;
    }
    private BufferedImage resize(BufferedImage source,int limit,boolean alpha){
        double factor=Math.min(1,limit/(double)Math.max(source.getWidth(),source.getHeight()));
        BufferedImage target=new BufferedImage(Math.max(1,(int)Math.round(source.getWidth()*factor)),Math.max(1,(int)Math.round(source.getHeight()*factor)),alpha?BufferedImage.TYPE_INT_ARGB:BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics=target.createGraphics();try{graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);graphics.drawImage(source,0,0,target.getWidth(),target.getHeight(),null);}finally{graphics.dispose();}return target;
    }
    private byte[] encode(BufferedImage image,String extension)throws IOException{
        ImageWriter writer=ImageIO.getImageWritersByFormatName(extension).next();ByteArrayOutputStream bytes=new ByteArrayOutputStream();
        try(ImageOutputStream output=ImageIO.createImageOutputStream(bytes)){writer.setOutput(output);var param=writer.getDefaultWriteParam();if(extension.equals("jpg")){param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);param.setCompressionQuality(.85f);}writer.write(null,new IIOImage(image,null,null),param);}
        finally{writer.dispose();}return bytes.toByteArray();
    }
}
