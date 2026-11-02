package com.agence.voyage.repository;

import com.agence.voyage.dto.stats.StatsDtos.*;
import com.agence.voyage.service.StatsPeriod;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.sql.*;
import java.time.*;
import java.util.*;

/** Agrégats SQL scalaires. Aucune entité chargée pour compter, sommer ou classer. */
@Repository
public class StatsRepository {
 private final NamedParameterJdbcTemplate jdbc;
 private static final String EARNED="b.status IN ('CONFIRMED','COMPLETED')";
 public StatsRepository(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
 public record Totals(long count,long confirmedCount,BigDecimal revenue,BigDecimal pending){}
 public record Users(long total,long active,long archived,long estimated,long newUsers,long previousPopulation){}
 private MapSqlParameterSource params(StatsPeriod p,Long supplier,Long client){
  var args=new MapSqlParameterSource();
  if(p!=null)args.addValue("from",p.startUtc()).addValue("until",p.endUtc());
  if(supplier!=null)args.addValue("supplier",supplier);if(client!=null)args.addValue("client",client);
  return args;
 }
 private String source(Long supplier){
  return supplier==null?"bookings b":"booking_items i JOIN bookings b ON b.id=i.booking_id";
 }
 private String where(StatsPeriod p,Long supplier,Long client){
  return " WHERE 1=1"+(p==null?"":" AND b.created_at>=:from AND b.created_at<:until")
   +(supplier==null?"":" AND i.offer_id IS NOT NULL AND i.supplier_id=:supplier")
   +(client==null?"":" AND b.client_id=:client");
 }
 private String value(Long supplier){return supplier==null?"b.total":"i.unit_price*i.quantity";}
 private BigDecimal money(ResultSet row,String column)throws SQLException{BigDecimal v=row.getBigDecimal(column);return v==null?BigDecimal.ZERO:v;}
 private LocalDateTime at(ResultSet row,String name)throws SQLException{Timestamp t=row.getTimestamp(name);return t==null?null:t.toLocalDateTime();}
 public Totals totals(StatsPeriod p,Long supplier,Long client){
  String sql="SELECT COUNT(DISTINCT b.id) AS count_value,COUNT(DISTINCT CASE WHEN "+EARNED+" THEN b.id END) AS confirmed_count,"
   +"COALESCE(SUM(CASE WHEN "+EARNED+" THEN "+value(supplier)+" ELSE 0 END),0) AS revenue,"
   +"COALESCE(SUM(CASE WHEN b.status='PENDING' THEN "+value(supplier)+" ELSE 0 END),0) AS pending FROM "+source(supplier)+where(p,supplier,client);
  return jdbc.queryForObject(sql,params(p,supplier,client),(r,n)->new Totals(r.getLong("count_value"),r.getLong("confirmed_count"),money(r,"revenue"),money(r,"pending")));
 }
 public Map<String,Long> statuses(StatsPeriod p,Long supplier,Long client){
  Map<String,Long> counts=new LinkedHashMap<>();
  for(var status:com.agence.voyage.entity.BookingStatus.values())counts.put(status.name(),0L);
  jdbc.query("SELECT b.status,COUNT(DISTINCT b.id) AS qty FROM "+source(supplier)+where(p,supplier,client)+" GROUP BY b.status",
   params(p,supplier,client),r->{counts.put(r.getString("status"),r.getLong("qty"));});
  return counts;
 }
 public List<Point> series(StatsPeriod period,Long supplier,Long client){
  var args=params(period,supplier,client);StringBuilder bucket=new StringBuilder("CASE ");
  for(int n=0;n<period.buckets().size();n++){
   var p=period.buckets().get(n);
   bucket.append("WHEN b.created_at>=:bucketFrom").append(n).append(" AND b.created_at<:bucketUntil").append(n).append(" THEN '").append(p.key()).append("' ");
   args.addValue("bucketFrom"+n,StatsPeriod.utc(p.from())).addValue("bucketUntil"+n,StatsPeriod.utc(p.until()));
  }
  bucket.append("END");
  String sql="SELECT "+bucket+" AS bucket,COUNT(DISTINCT b.id) AS qty,COALESCE(SUM(CASE WHEN "+EARNED+" THEN "+value(supplier)+" ELSE 0 END),0) AS revenue"
   +" FROM "+source(supplier)+where(period,supplier,client)+" GROUP BY bucket";
  Map<String,Point> rows=new HashMap<>();
  jdbc.query(sql,args,r->{String key=r.getString("bucket");rows.put(key,new Point(key,key,r.getLong("qty"),money(r,"revenue")));});
  return period.buckets().stream().map(b->{var r=rows.get(b.key());return new Point(b.key(),b.label(),r==null?0:r.bookings(),r==null?BigDecimal.ZERO:r.revenue());}).toList();
 }
 public Users users(StatsPeriod p){
  return jdbc.queryForObject("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN archived=false THEN 1 ELSE 0 END),0) AS active,"
   +"COALESCE(SUM(CASE WHEN archived=true THEN 1 ELSE 0 END),0) AS archived,"
   +"COALESCE(SUM(CASE WHEN created_at_estimated=true THEN 1 ELSE 0 END),0) AS estimated,"
   +"COALESCE(SUM(CASE WHEN created_at>=:from AND created_at<:until AND created_at_estimated=false THEN 1 ELSE 0 END),0) AS new_users,"
   +"COALESCE(SUM(CASE WHEN created_at<:from AND created_at_estimated=false THEN 1 ELSE 0 END),0) AS previous_population FROM users",
   params(p,null,null),(r,n)->new Users(r.getLong("total"),r.getLong("active"),r.getLong("archived"),r.getLong("estimated"),r.getLong("new_users"),r.getLong("previous_population")));
 }
 public Map<String,Long> roles(){
  Map<String,Long> result=new LinkedHashMap<>();for(var role:com.agence.voyage.entity.Role.values())result.put(role.name(),0L);
  jdbc.query("SELECT role,COUNT(*) AS qty FROM users GROUP BY role",new MapSqlParameterSource(),r->{result.put(r.getString("role"),r.getLong("qty"));});
  return result;
 }
 private String topJoins(){
  return " FROM booking_items i JOIN bookings b ON b.id=i.booking_id JOIN offers o ON o.id=i.offer_id JOIN cities c ON c.id=o.city_id"
   +" WHERE i.offer_id IS NOT NULL AND "+EARNED+" AND b.created_at>=:from AND b.created_at<:until";
 }
 private static final String NET_LINE="COALESCE(i.unit_price*i.quantity*b.total/NULLIF(b.subtotal,0),0)";
 public List<Destination> destinations(StatsPeriod p){
  return jdbc.query("SELECT c.id,c.name,COUNT(DISTINCT b.id) AS qty,SUM("+NET_LINE+") AS revenue"+topJoins()
   +" GROUP BY c.id,c.name ORDER BY qty DESC,revenue DESC,c.id LIMIT 5",params(p,null,null),
   (r,n)->new Destination(r.getLong("id"),r.getString("name"),r.getLong("qty"),money(r,"revenue")));
 }
 public List<TopOffer> topOffers(StatsPeriod p){
  return jdbc.query("SELECT o.id,o.title,o.offer_type,c.name AS city,COUNT(DISTINCT b.id) AS qty,SUM("+NET_LINE+") AS revenue"+topJoins()
   +" GROUP BY o.id,o.title,o.offer_type,c.name ORDER BY qty DESC,revenue DESC,o.id LIMIT 5",params(p,null,null),
   (r,n)->new TopOffer(r.getLong("id"),r.getString("title"),r.getString("offer_type"),r.getString("city"),r.getLong("qty"),money(r,"revenue")));
 }
 public List<PromoWatch> promoWatch(StatsPeriod p,LocalDate today){
  String sql="SELECT p.id,p.code,p.active,p.expiry_date,"
   +"COALESCE(SUM(CASE WHEN b.created_at>=:from AND b.created_at<:until AND b.status IN ('PENDING','CONFIRMED','COMPLETED') THEN 1 ELSE 0 END),0) AS uses_count,"
   +"COUNT(b.id) AS history_count,COALESCE(MAX(c.cart_count),0) AS carts FROM promo_codes p LEFT JOIN bookings b ON b.promo_code_id=p.id"
   +" LEFT JOIN (SELECT promo_code_id,COUNT(*) AS cart_count FROM carts WHERE promo_code_id IS NOT NULL GROUP BY promo_code_id) c ON c.promo_code_id=p.id"
   +" GROUP BY p.id,p.code,p.active,p.expiry_date"
   +" HAVING (p.expiry_date>=:today AND p.expiry_date<=:soon) OR uses_count>=10 OR (p.active=false AND (history_count>0 OR carts>0))"
   +" ORDER BY uses_count DESC,p.id LIMIT 20";
  return jdbc.query(sql,params(p,null,null).addValue("today",today).addValue("soon",today.plusDays(7)),(r,n)->{
   var expiry=r.getDate("expiry_date");String reason=!r.getBoolean("active")?"INACTIVE_USED":r.getLong("uses_count")>=10?"HEAVY_USAGE":"EXPIRING";
   return new PromoWatch(r.getLong("id"),r.getString("code"),reason,r.getLong("uses_count"),expiry==null?null:expiry.toLocalDate(),r.getBoolean("active"));
  });
 }
 public long withoutAvailability(Long supplier,LocalDateTime now){
  String sql="SELECT COUNT(*) FROM offers o WHERE o.active=true"+(supplier==null?"":" AND o.supplier_id=:supplier")
   +" AND NOT EXISTS(SELECT 1 FROM offer_availabilities a WHERE a.offer_id=o.id AND a.available_until>:now AND a.capacity>0)";
  return jdbc.queryForObject(sql,new MapSqlParameterSource("now",now).addValue("supplier",supplier),Long.class);
 }
 public long oldPending(LocalDateTime cutoff){
  return jdbc.queryForObject("SELECT COUNT(*) FROM bookings WHERE status='PENDING' AND created_at<:cutoff",Map.of("cutoff",cutoff),Long.class);
 }
 public OfferCounts offers(Long supplier){
  return jdbc.queryForObject("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN active=true THEN 1 ELSE 0 END),0) AS active FROM offers WHERE supplier_id=:id",
   Map.of("id",supplier),(r,n)->new OfferCounts(r.getLong("total"),r.getLong("active"),r.getLong("total")-r.getLong("active")));
 }
 private String checkQuery(){
  return "SELECT o.id,o.title,c.name AS city,"
   +"MAX(CASE WHEN a.available_until>:now THEN 1 ELSE 0 END) AS has_future,"
   +"MAX(CASE WHEN a.available_until>:now AND (a.capacity<3 OR a.capacity*100<(a.capacity+COALESCE(used.qty,0))*20) THEN 1 ELSE 0 END) AS low_capacity,"
   +"MAX(a.available_until) AS last_end FROM offers o JOIN cities c ON c.id=o.city_id"
   +" LEFT JOIN offer_availabilities a ON a.offer_id=o.id"
   +" LEFT JOIN (SELECT availability_id,SUM(quantity) AS qty FROM booking_allocations WHERE restored=false GROUP BY availability_id) used ON used.availability_id=a.id"
   +" WHERE o.active=true AND o.supplier_id=:supplier GROUP BY o.id,o.title,c.name"
   +" HAVING has_future=0 OR low_capacity=1 OR last_end<=:soon";
 }
 public AvailabilityStats availability(Long supplier,LocalDateTime now){
  var args=new MapSqlParameterSource("supplier",supplier).addValue("now",now).addValue("soon",now.plusDays(14));
  long total=jdbc.queryForObject("SELECT COUNT(*) FROM ("+checkQuery()+") checks",args,Long.class);
  var rows=jdbc.query(checkQuery()+" ORDER BY has_future,low_capacity DESC,o.id LIMIT 20",args,(r,n)->{
   LocalDateTime end=at(r,"last_end");return new AvailabilityCheck(r.getLong("id"),r.getString("title"),r.getString("city"),
    r.getInt("has_future")==0,r.getInt("low_capacity")==1,end!=null&&!end.isAfter(now.plusDays(14)),end);
  });
  return new AvailabilityStats(total,rows);
 }
 public List<RecentBooking> recent(StatsPeriod p,Long supplier,Long client,boolean next,LocalDateTime now){
  String amount=supplier==null?"b.total":"SUM(i.unit_price*i.quantity)";
  String select="SELECT b.id,b.reference,b.status,b.payment_status,u.full_name,"+amount+" AS amount,b.currency,b.created_at,b.service_start_at,b.service_end_at"
   +" FROM "+source(supplier)+" JOIN users u ON u.id=b.client_id"+where(p,supplier,client);
  if(next)select+=" AND b.status='CONFIRMED' AND b.service_start_at>:now";
  if(supplier!=null)select+=" GROUP BY b.id,b.reference,b.status,b.payment_status,u.full_name,b.currency,b.created_at,b.service_start_at,b.service_end_at";
  select+=next?" ORDER BY b.service_start_at,b.id LIMIT 1":" ORDER BY b.created_at DESC,b.id DESC LIMIT 5";
  return jdbc.query(select,params(p,supplier,client).addValue("now",now),(r,n)->new RecentBooking(r.getLong("id"),r.getString("reference"),
   r.getString("status"),r.getString("payment_status"),r.getString("full_name"),money(r,"amount"),r.getString("currency"),at(r,"created_at"),at(r,"service_start_at"),at(r,"service_end_at")));
 }
 public List<Activity> activities(Long user,boolean unread){
  return jdbc.query("SELECT id,type,title,message,created_at,link FROM notifications WHERE user_id=:id"
   +(unread?" AND is_read=false":"")+" ORDER BY created_at DESC,id DESC LIMIT 5",Map.of("id",user),
   (r,n)->new Activity(r.getLong("id"),r.getString("type"),r.getString("title"),r.getString("message"),at(r,"created_at"),r.getString("link")));
 }
 public long unread(Long user){return jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id=:id AND is_read=false",Map.of("id",user),Long.class);}
 public record CashTotals(long count,BigDecimal amount){}
 private String cashWhere(){return " FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE p.method='CASH_ON_ARRIVAL' AND p.status='PENDING' AND b.status='CONFIRMED'";}
 public CashTotals cashTotals(){
  return jdbc.queryForObject("SELECT COUNT(*) AS qty,COALESCE(SUM(p.amount),0) AS amount"+cashWhere(),Map.of(),(r,n)->new CashTotals(r.getLong("qty"),money(r,"amount")));
 }
 public List<CashPayment> upcomingCash(){
  String query="SELECT p.id,b.id AS booking_id,b.reference,u.full_name,p.amount,b.service_start_at"
   +cashWhere().replace(" WHERE "," JOIN users u ON u.id=b.client_id WHERE ")+" ORDER BY b.service_start_at,p.id LIMIT 5";
  return jdbc.query(query,Map.of(),(r,n)->new CashPayment(r.getLong("id"),r.getLong("booking_id"),r.getString("reference"),r.getString("full_name"),money(r,"amount"),at(r,"service_start_at")));
 }
 public long createdBetween(LocalDateTime from,LocalDateTime until){
  return jdbc.queryForObject("SELECT COUNT(*) FROM bookings WHERE created_at>=:from AND created_at<:until",Map.of("from",from,"until",until),Long.class);
 }
 public BigDecimal spent(StatsPeriod period,Long client){
  var args=params(period,null,client);
  return jdbc.queryForObject("SELECT COALESCE(SUM(p.amount-p.refunded_amount),0) FROM payments p JOIN bookings b ON b.id=p.booking_id"
   +" WHERE p.client_id=:client AND p.status IN ('PAID','PARTIALLY_REFUNDED','REFUNDED')"
   +(period==null?"":" AND b.created_at>=:from AND b.created_at<:until"),args,BigDecimal.class);
 }
}
