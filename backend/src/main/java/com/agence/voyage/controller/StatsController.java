package com.agence.voyage.controller;
import com.agence.voyage.dto.stats.StatsDtos.*;
import com.agence.voyage.entity.BookingStatus;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.*;
import java.time.format.DateTimeFormatter;
@RestController @RequestMapping("/api/stats")
@Tag(name="Statistiques",description="MAD TTC, périodes Africa/Casablanca. JWT et rôle obligatoires ; fournisseur/client limités au sujet connecté.")
public class StatsController {
 private final StatsService service;private final StatsCsvService csv;private final Clock clock;
 public StatsController(StatsService service,StatsCsvService csv,Clock clock){this.service=service;this.csv=csv;this.clock=clock;}
 @GetMapping("/admin") @Operation(summary="Dashboard administrateur",description="ADMIN uniquement. Cache serveur deux minutes.")
 public Admin admin(@AuthenticationPrincipal AppUserDetails u,@RequestParam(defaultValue="30d")String period){return service.admin(u.getId(),period);}
 @GetMapping("/supplier") @Operation(summary="Dashboard de mon fournisseur")
 public Supplier supplier(@AuthenticationPrincipal AppUserDetails u,@RequestParam(defaultValue="30d")String period){return service.supplier(u.getId(),period);}
 @GetMapping("/agent") @Operation(summary="Dashboard opérationnel",description="AGENT ou ADMIN.")
 public Agent agent(@AuthenticationPrincipal AppUserDetails u,@RequestParam(defaultValue="30d")String period){return service.agent(u.getId(),period);}
 @GetMapping("/client") @Operation(summary="Mes voyages et mon activité")
 public Client client(@AuthenticationPrincipal AppUserDetails u,@RequestParam(defaultValue="30d")String period){return service.client(u.getId(),period);}
 private ResponseEntity<StreamingResponseBody> download(String name,StreamingResponseBody body){
  String stamp=clock.instant().atZone(StatsPeriod.ZONE).format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
  return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
   .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(name+"-"+stamp+".csv").build().toString())
   .header("X-Export-Max-Rows",Integer.toString(StatsCsvService.MAX_ROWS)).body(body);
 }
 @GetMapping("/admin/export/bookings.csv") @Operation(summary="Exporter les réservations CSV",description="ADMIN, UTF-8 BOM, séparateur ;, 50000 lignes maximum.")
 public ResponseEntity<StreamingResponseBody> bookings(@AuthenticationPrincipal AppUserDetails u,
  @RequestParam(required=false)LocalDate from,@RequestParam(required=false)LocalDate to,
  @RequestParam(required=false)BookingStatus status,@RequestParam(defaultValue="30d")String period,jakarta.servlet.http.HttpServletRequest request){
  service.authorizeAdmin(u.getId());var selection=csv.selection(from,to,status,period);
  request.setAttribute(StatsCsvService.AUTHORIZED_REQUEST_ATTRIBUTE,Boolean.TRUE);
  return download("reservations",out->csv.bookings(out,selection));
 }
 @GetMapping("/admin/export/revenue.csv") @Operation(summary="Exporter le chiffre d'affaires CSV",description="ADMIN, série complète avec les zéros.")
 public ResponseEntity<StreamingResponseBody> revenue(@AuthenticationPrincipal AppUserDetails u,@RequestParam(defaultValue="30d")String period,jakarta.servlet.http.HttpServletRequest request){
  service.authorizeAdmin(u.getId());var p=StatsPeriod.resolve(period,clock);
  request.setAttribute(StatsCsvService.AUTHORIZED_REQUEST_ATTRIBUTE,Boolean.TRUE);
  return download("chiffre-affaires",out->csv.revenue(out,p));
 }
}
