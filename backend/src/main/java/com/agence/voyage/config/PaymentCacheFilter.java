package com.agence.voyage.config;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
@Component @Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE+1)
public class PaymentCacheFilter extends OncePerRequestFilter {
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws IOException,ServletException{
  if(request.getRequestURI().startsWith("/api/payments"))response.setHeader("Cache-Control","no-store");
  chain.doFilter(request,response);
 }
}

