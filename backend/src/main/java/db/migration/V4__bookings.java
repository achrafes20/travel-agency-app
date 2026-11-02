package db.migration;

import org.flywaydb.core.api.migration.*;
import java.sql.*;
import java.util.*;

/** Adoption non destructive des anciennes réservations et des disponibilités sans identifiant.
 * DDL conditionnel : une base historiquement passée par Hibernate peut déjà avoir des colonnes.
 */
public class V4__bookings extends BaseJavaMigration {
 @Override public Integer getChecksum() { return 202610301; }
 @Override public void migrate(Context context) throws Exception {
  Connection c=context.getConnection();
  column(c,"offer_availabilities","id","BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY");
  dropChecks(c,"offer_availabilities","capacity");
  exec(c,"ALTER TABLE offer_availabilities ADD CONSTRAINT chk_availability_nonnegative CHECK(capacity >= 0)");
  dropChecks(c,"bookings",null);
  exec(c,"ALTER TABLE bookings MODIFY quantity INT NULL, MODIFY total_price DOUBLE NULL");
  exec(c,"ALTER TABLE bookings MODIFY payment_method ENUM('ONLINE','PAY_ON_ARRIVAL','SIMULATED','ON_ARRIVAL') NOT NULL");
  exec(c,"ALTER TABLE payments MODIFY method ENUM('ONLINE','PAY_ON_ARRIVAL','SIMULATED','ON_ARRIVAL') NOT NULL");
  Map<String,String> columns=new LinkedHashMap<>();
  columns.put("reference","VARCHAR(32) NULL");
  columns.put("payment_status","ENUM('PENDING','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING'");
  for(String n:List.of("subtotal","discount","total")) columns.put(n,"DECIMAL(12,2) NOT NULL DEFAULT 0");
  columns.put("currency","VARCHAR(3) NOT NULL DEFAULT 'MAD'");
  columns.put("promo_code_snapshot","VARCHAR(255) NULL"); columns.put("promo_type_snapshot","ENUM('FIXED','PERCENTAGE') NULL");
  columns.put("promo_value_snapshot","DECIMAL(12,2) NULL");
  for(String n:List.of("confirmed_at","cancelled_at","expires_at","service_start_at","service_end_at")) columns.put(n,"DATETIME(6) NULL");
  columns.put("cancellation_reason","VARCHAR(1000) NULL"); columns.put("cancelled_by","BIGINT NULL");
  columns.put("contact_phone","VARCHAR(40) NULL"); columns.put("notes","VARCHAR(2000) NULL"); columns.put("version","BIGINT NOT NULL DEFAULT 0");
  for(var e:columns.entrySet()) column(c,"bookings",e.getKey(),e.getValue());
  exec(c,"CREATE TABLE IF NOT EXISTS booking_sequence (sequence_year INT PRIMARY KEY, last_value BIGINT NOT NULL)");
  exec(c,"CREATE TABLE IF NOT EXISTS booking_items (id BIGINT AUTO_INCREMENT PRIMARY KEY, booking_id BIGINT NOT NULL, offer_id BIGINT NULL, bundle_id BIGINT NULL, parent_item_id BIGINT NULL, supplier_id BIGINT NULL, title_snapshot VARCHAR(255) NOT NULL, quantity INT NOT NULL, unit_price DECIMAL(12,2) NOT NULL, line_total DECIMAL(12,2) NOT NULL, travel_criteria TEXT NULL, service_start_at DATETIME(6) NOT NULL, service_end_at DATETIME(6) NOT NULL, CONSTRAINT fk_bi_booking FOREIGN KEY(booking_id) REFERENCES bookings(id), CONSTRAINT fk_bi_offer FOREIGN KEY(offer_id) REFERENCES offers(id), CONSTRAINT fk_bi_bundle FOREIGN KEY(bundle_id) REFERENCES bundles(id), CONSTRAINT fk_bi_parent FOREIGN KEY(parent_item_id) REFERENCES booking_items(id), CONSTRAINT fk_bi_supplier FOREIGN KEY(supplier_id) REFERENCES users(id), CONSTRAINT chk_bi_target CHECK((offer_id IS NULL) <> (bundle_id IS NULL)), CONSTRAINT chk_bi_quantity CHECK(quantity>0))");
  exec(c,"CREATE TABLE IF NOT EXISTS booking_allocations (id BIGINT AUTO_INCREMENT PRIMARY KEY, booking_item_id BIGINT NOT NULL, availability_id BIGINT NOT NULL, quantity INT NOT NULL, restored BOOLEAN NOT NULL DEFAULT FALSE, CONSTRAINT fk_ba_item FOREIGN KEY(booking_item_id) REFERENCES booking_items(id), CONSTRAINT fk_ba_availability FOREIGN KEY(availability_id) REFERENCES offer_availabilities(id), CONSTRAINT chk_ba_quantity CHECK(quantity>0))");
  // Archives antérieures : conserver leurs montants et dates connues, sans inventer une allocation passée.
  exec(c,"UPDATE bookings b LEFT JOIN promo_codes p ON p.id=b.promo_code_id LEFT JOIN payments pay ON pay.booking_id=b.id SET b.reference=CONCAT('BK-',YEAR(b.created_at),'-',LPAD(b.id,6,'0')), b.subtotal=COALESCE(b.total_price,0), b.total=COALESCE(b.total_price,0), b.service_start_at=b.created_at, b.service_end_at=b.created_at, b.payment_status=COALESCE(pay.status,'PENDING'), b.promo_code_snapshot=p.code, b.promo_type_snapshot=p.discount_type, b.promo_value_snapshot=p.discount_value WHERE b.reference IS NULL");
  exec(c,"UPDATE bookings SET payment_method=CASE WHEN payment_method='ON_ARRIVAL' THEN 'PAY_ON_ARRIVAL' WHEN payment_method='SIMULATED' THEN 'ONLINE' ELSE payment_method END");
  exec(c,"ALTER TABLE bookings MODIFY reference VARCHAR(32) NOT NULL");
  exec(c,"INSERT INTO booking_sequence(sequence_year,last_value) SELECT YEAR(created_at),MAX(CAST(SUBSTRING_INDEX(reference,'-',-1) AS UNSIGNED)) FROM bookings GROUP BY YEAR(created_at) ON DUPLICATE KEY UPDATE last_value=GREATEST(last_value,VALUES(last_value))");
  exec(c,"INSERT INTO booking_items(booking_id,offer_id,bundle_id,supplier_id,title_snapshot,quantity,unit_price,line_total,service_start_at,service_end_at) SELECT b.id,b.offer_id,b.bundle_id,o.supplier_id,COALESCE(o.title,bu.title,'Archive'),COALESCE(b.quantity,1),b.total/GREATEST(COALESCE(b.quantity,1),1),b.total,b.service_start_at,b.service_end_at FROM bookings b LEFT JOIN offers o ON o.id=b.offer_id LEFT JOIN bundles bu ON bu.id=b.bundle_id WHERE (b.offer_id IS NOT NULL OR b.bundle_id IS NOT NULL) AND NOT EXISTS(SELECT 1 FROM booking_items i WHERE i.booking_id=b.id)");
  index(c,"bookings","uk_booking_reference","reference",true);
  index(c,"bookings","idx_booking_expiry","status,expires_at",false);
  index(c,"bookings","idx_booking_created","created_at",false);
  for(String n:List.of("booking_id","supplier_id","offer_id")) index(c,"booking_items","idx_bi_"+n,n,false);
  index(c,"booking_allocations","idx_allocation_availability","availability_id",false);
 }
 private void exec(Connection c,String sql) throws SQLException { try(Statement s=c.createStatement()){s.execute(sql);} }
 private void column(Connection c,String t,String n,String definition) throws SQLException {
  try(ResultSet r=c.getMetaData().getColumns(c.getCatalog(),null,t,n)){if(r.next())return;}
  exec(c,"ALTER TABLE "+t+" ADD COLUMN "+n+" "+definition);
 }
 private void dropChecks(Connection c,String table,String contains) throws SQLException {
  List<String> names=new ArrayList<>();
  try(PreparedStatement s=c.prepareStatement("SELECT tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA=DATABASE() AND tc.TABLE_NAME=? AND tc.CONSTRAINT_TYPE='CHECK'")) {
   s.setString(1,table);try(ResultSet r=s.executeQuery()){while(r.next()) if(contains==null||r.getString(2).toLowerCase(Locale.ROOT).contains(contains)) names.add(r.getString(1));}
  }
  boolean maria=(c.getMetaData().getDatabaseProductName()+" "+c.getMetaData().getDatabaseProductVersion()).toLowerCase(Locale.ROOT).contains("maria");
  for(String n:names) exec(c,"ALTER TABLE "+table+(maria?" DROP CONSTRAINT `":" DROP CHECK `")+n+"`");
 }
 private void index(Connection c,String t,String n,String cols,boolean unique)throws SQLException{
  try(ResultSet r=c.getMetaData().getIndexInfo(c.getCatalog(),null,t,false,false)){while(r.next())if(n.equalsIgnoreCase(r.getString("INDEX_NAME")))return;}
  exec(c,"CREATE "+(unique?"UNIQUE ":"")+"INDEX "+n+" ON "+t+"("+cols+")");
 }
}

