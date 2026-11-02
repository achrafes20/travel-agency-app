package com.agence.voyage.config;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
@Component @Order(Ordered.HIGHEST_PRECEDENCE+12)
public class StatsCacheControlFilter extends OncePerRequestFilter {
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
  if(request.getRequestURI().startsWith("/api/stats/"))response.setHeader("Cache-Control","no-store");
  chain.doFilter(request,response);
 }
}
