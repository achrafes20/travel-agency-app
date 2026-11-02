package com.agence.voyage.service;
import com.agence.voyage.entity.BookingStatus;
import com.agence.voyage.exception.*;
import com.agence.voyage.dto.stats.StatsDtos.Point;
import com.agence.voyage.repository.StatsRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.io.*;
import java.sql.*;
import java.time.*;
import java.util.*;
@Service
public class StatsCsvService {
 public static final int MAX_ROWS=50000;
 public static final String AUTHORIZED_REQUEST_ATTRIBUTE="atlas.stats.csv.authorized";
 private final JdbcTemplate jdbc;private final StatsRepository repository;private final Clock clock;
 public StatsCsvService(JdbcTemplate jdbc,StatsRepository repository,Clock clock){this.jdbc=jdbc;this.repository=repository;this.clock=clock;}
 public record Selection(LocalDate from,LocalDate to,BookingStatus status){}
 public Selection selection(LocalDate from,LocalDate to,BookingStatus status,String period){
  var p=StatsPeriod.resolve(period,clock);LocalDate start=from==null?p.from():from,end=to==null?p.to():to;
  if(start.isAfter(end)||end.plusDays(1).isAfter(start.plusMonths(24)))
   throw new BusinessException(ErrorCode.BAD_REQUEST,"La plage doit être ordonnée et ne pas dépasser 24 mois");
  return new Selection(start,end,status);
 }
 public static String cell(String value,boolean text){
  String safe=value==null?"":value;
  if(text&&!safe.isEmpty()){
   String trimmed=safe.stripLeading();
   if("=+-@\t\r\n".indexOf(safe.charAt(0))>=0||!trimmed.isEmpty()&&"=+-@".indexOf(trimmed.charAt(0))>=0)safe="'"+safe;
  }
  return "\""+safe.replace("\"","\"\"")+"\"";
 }
 private void line(Writer writer,Object...values)throws IOException{
  for(int n=0;n<values.length;n++){
   if(n>0)writer.write(';');Object value=values[n];
   writer.write(cell(value==null?"":value.toString(),!(value instanceof Number)));
  }writer.write("\r\n");
 }
 public void bookings(OutputStream output,Selection selection)throws IOException{
  Writer writer=new BufferedWriter(new OutputStreamWriter(output,java.nio.charset.StandardCharsets.UTF_8));writer.write('\uFEFF');
  line(writer,"Référence","Client","Statut","Paiement","Créée le","Début du service","Total TTC","Devise","Prestations");
  String sql="SELECT b.reference,u.full_name,b.status,b.payment_status,b.created_at,b.service_start_at,b.total,b.currency,"
   +"(SELECT MIN(i.title_snapshot) FROM booking_items i WHERE i.booking_id=b.id AND i.offer_id IS NOT NULL) AS offer_title"
   +" FROM bookings b JOIN users u ON u.id=b.client_id WHERE b.created_at>=? AND b.created_at<?"
   +(selection.status()==null?"":" AND b.status=?")+" ORDER BY b.created_at,b.id LIMIT "+MAX_ROWS;
  final int[] count={0};
  try{
   jdbc.query(connection->{
    PreparedStatement statement=connection.prepareStatement(sql,ResultSet.TYPE_FORWARD_ONLY,ResultSet.CONCUR_READ_ONLY);
    boolean mysql=connection.getMetaData().getDatabaseProductName().toLowerCase(Locale.ROOT).matches(".*(mysql|mariadb).*");
    statement.setFetchSize(mysql?Integer.MIN_VALUE:500);
    statement.setTimestamp(1,Timestamp.valueOf(StatsPeriod.utc(selection.from())));
    statement.setTimestamp(2,Timestamp.valueOf(StatsPeriod.utc(selection.to().plusDays(1))));
    if(selection.status()!=null)statement.setString(3,selection.status().name());return statement;
   },(org.springframework.jdbc.core.RowCallbackHandler)row->{
    try{
     line(writer,row.getString("reference"),row.getString("full_name"),row.getString("status"),row.getString("payment_status"),
      row.getTimestamp("created_at").toLocalDateTime(),row.getTimestamp("service_start_at")==null?null:row.getTimestamp("service_start_at").toLocalDateTime(),
      StatsService.money(row.getBigDecimal("total")),row.getString("currency"),row.getString("offer_title"));
     if(++count[0]%500==0)writer.flush();
    }catch(IOException ex){throw new UncheckedIOException(ex);}
   });
  }catch(UncheckedIOException ex){throw ex.getCause();}
  writer.flush();
 }
 public void revenue(OutputStream output,StatsPeriod period)throws IOException{
  Writer writer=new BufferedWriter(new OutputStreamWriter(output,java.nio.charset.StandardCharsets.UTF_8));writer.write('\uFEFF');
  line(writer,"Période","Réservations créées","Chiffre d'affaires TTC","Devise");
  for(Point point:StatsService.round(repository.series(period,null,null)))line(writer,point.key(),point.bookings(),point.revenue(),"MAD");
  writer.flush();
 }
}
