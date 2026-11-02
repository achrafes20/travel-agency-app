package com.agence.voyage.service;
import com.agence.voyage.exception.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.regex.*;

@Component
public class PaymentDataGuard {
 private static final Pattern PAN=Pattern.compile("(?<![0-9])(?:[0-9][ -]?){12,18}[0-9](?![0-9])");
 public void inspect(JsonNode node){
  if(node.isObject()){
   node.fields().forEachRemaining(entry->{
    String key=entry.getKey().toLowerCase(Locale.ROOT);
    if(key.contains("cvv")||key.contains("cvc"))reject();
    inspect(entry.getValue());
   });
  }else if(node.isArray())node.forEach(this::inspect);
  else if(node.isValueNode()){
   Matcher matches=PAN.matcher(node.asText());
   while(matches.find())if(luhn(matches.group().replace(" ","").replace("-","")))reject();
  }
 }
 private void reject(){throw new BusinessException(ErrorCode.CARD_DATA_REJECTED,"Les numéros de carte complets et les codes de sécurité ne doivent jamais être transmis au serveur");}
 public static boolean luhn(String digits){
  if(!digits.matches("[0-9]{13,19}"))return false;
  int sum=0;boolean doubleDigit=false;
  for(int i=digits.length()-1;i>=0;i--){int n=digits.charAt(i)-'0';if(doubleDigit){n*=2;if(n>9)n-=9;}sum+=n;doubleDigit=!doubleDigit;}
  return sum%10==0;
 }
 public JsonNode canonical(JsonNode node){
  if(node.isObject()){
   ObjectNode sorted=JsonNodeFactory.instance.objectNode();TreeSet<String> keys=new TreeSet<>();node.fieldNames().forEachRemaining(keys::add);
   keys.forEach(key->sorted.set(key,canonical(node.get(key))));return sorted;
  }
  if(node.isArray()){ArrayNode array=JsonNodeFactory.instance.arrayNode();node.forEach(v->array.add(canonical(v)));return array;}
  return node;
 }
}

