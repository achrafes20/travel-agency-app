package com.agence.voyage.config;
import com.agence.voyage.service.*;
import com.agence.voyage.exception.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import org.springframework.core.MethodParameter;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.context.request.*;
import java.lang.reflect.Type;
import java.io.*;

@ControllerAdvice
public class PaymentRequestAdvice extends RequestBodyAdviceAdapter {
 private final PaymentDataGuard guard;private final ObjectMapper mapper;
 public PaymentRequestAdvice(PaymentDataGuard guard,ObjectMapper mapper){this.guard=guard;this.mapper=mapper;}
 @Override public boolean supports(MethodParameter p,Type type,Class<? extends HttpMessageConverter<?>> converter){return p.getContainingClass().getSimpleName().equals("PaymentController");}
 @Override public HttpInputMessage beforeBodyRead(HttpInputMessage input,MethodParameter p,Type type,Class<? extends HttpMessageConverter<?>> converter)throws IOException{
  byte[] bytes=input.getBody().readNBytes(16385);
  if(bytes.length>16384)throw new BusinessException(ErrorCode.BAD_REQUEST,"La demande de paiement est trop volumineuse");
  try{
   var tree=mapper.readTree(bytes);if(tree==null)throw new BusinessException(ErrorCode.BAD_REQUEST,"Un corps JSON est requis");
   guard.inspect(tree);
   if(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)
    attrs.getRequest().setAttribute("paymentRequestHash",PaymentIdempotency.sha256(guard.canonical(tree).toString()));
  }catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new BusinessException(ErrorCode.BAD_REQUEST,"Le corps JSON est invalide");}
  return new HttpInputMessage(){public InputStream getBody(){return new ByteArrayInputStream(bytes);}public HttpHeaders getHeaders(){return input.getHeaders();}};
 }
}

