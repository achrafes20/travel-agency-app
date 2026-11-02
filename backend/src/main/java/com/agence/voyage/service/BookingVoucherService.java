package com.agence.voyage.service;
import com.agence.voyage.config.BookingModuleProperties;
import com.agence.voyage.dto.*;
import com.agence.voyage.exception.*;
import com.google.zxing.*;
import com.google.zxing.qrcode.QRCodeWriter;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.awt.image.BufferedImage;
import java.util.*;

@Service
public class BookingVoucherService {
 private final BookingModuleProperties properties;
 public BookingVoucherService(BookingModuleProperties properties){this.properties=properties;}
 public String token(String reference){
  try{
   Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(properties.voucher().secret().getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
   return Base64.getUrlEncoder().withoutPadding().encodeToString(Arrays.copyOf(mac.doFinal(reference.getBytes(StandardCharsets.UTF_8)),16));
  }catch(Exception e){throw new IllegalStateException("Signature du voucher impossible",e);}
 }
 public byte[] generate(BookingResponse b){
  if(!b.voucherAvailable())throw new BusinessException(ErrorCode.INVALID_BOOKING_STATE,HttpStatus.CONFLICT,"Le voucher est disponible uniquement pour une réservation confirmée ou terminée");
  try(PDDocument doc=new PDDocument();ByteArrayOutputStream out=new ByteArrayOutputStream()){
   List<String> lines=new ArrayList<>(List.of("ATLAS VOYAGE - Voucher",b.reference(),"Client : "+b.clientName(),
    "Statut : "+b.status()+" / paiement : "+b.paymentStatus(),"Méthode : "+b.paymentMethod(),
    "Service : "+b.serviceStartAt()+" au "+b.serviceEndAt(),""));
   for(BookingItemResponse i:b.items())if(i.parentItemId()==null){lines.add(i.title()+" x "+i.quantity()+" : "+i.lineTotal()+" MAD");lines.add("  "+i.serviceStartAt()+" - "+i.serviceEndAt());}
   lines.addAll(List.of("","Sous-total TTC : "+b.subtotal()+" MAD","Remise : "+b.discount()+" MAD","Total TTC : "+b.total()+" MAD",
    "Annulation client : jusqu'à "+properties.cancellationDeadlineHours()+" h avant le début du service.",
    "Mode sandbox : les paiements sont des simulations sans débit réel."));
   var matrix=new QRCodeWriter().encode("ATLAS|"+b.reference()+"|"+token(b.reference()),BarcodeFormat.QR_CODE,180,180);
   BufferedImage qr=new BufferedImage(180,180,BufferedImage.TYPE_INT_RGB);
   for(int x=0;x<180;x++)for(int y=0;y<180;y++)qr.setRGB(x,y,matrix.get(x,y)?0xff000000:0xffffffff);
   PDFont font=new PDType1Font(Standard14Fonts.FontName.HELVETICA);
   List<String> wrapped=new ArrayList<>();
   for(String line:lines)for(int i=0;i<Math.max(1,line.length());i+=85)wrapped.add(clean(line.substring(i,Math.min(i+85,line.length())),font));
   for(int offset=0;offset<wrapped.size();offset+=32){
    PDPage page=new PDPage();doc.addPage(page);
    try(PDPageContentStream stream=new PDPageContentStream(doc,page)){
     stream.beginText();stream.setFont(font,11);stream.setLeading(18);stream.newLineAtOffset(45,745);
     for(String line:wrapped.subList(offset,Math.min(offset+32,wrapped.size()))){stream.showText(line);stream.newLine();}
     stream.endText();
     if(offset==0)stream.drawImage(LosslessFactory.createFromImage(doc,qr),430,35,130,130);
    }
   }
   doc.save(out);return out.toByteArray();
  }catch(Exception e){throw new IllegalStateException("Génération du voucher impossible",e);}
 }
 private static String clean(String value,PDFont font){
  StringBuilder s=new StringBuilder();value.codePoints().forEach(cp->{String ch=new String(Character.toChars(cp));try{font.encode(ch);s.append(ch);}catch(Exception e){s.append('?');}});return s.toString();
 }
}

