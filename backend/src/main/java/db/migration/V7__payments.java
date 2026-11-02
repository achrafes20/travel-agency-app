package db.migration;

import org.flywaydb.core.api.migration.*;
import java.sql.*;
import java.util.*;

/** Paiements multi-tentatives, historiques append-only et reprise sans suppression de données. */
public class V7__payments extends BaseJavaMigration {
 @Override public Integer getChecksum(){return 202611001;}
 @Override public void migrate(Context context)throws Exception {
  Connection c=context.getConnection();
  String statuses="ENUM('PENDING','PROCESSING','PAID','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED')";
  exec(c,"ALTER TABLE payments MODIFY amount DECIMAL(12,2) NOT NULL, MODIFY status "+statuses+" NOT NULL, MODIFY method ENUM('CARD','CASH_ON_ARRIVAL','ONLINE','PAY_ON_ARRIVAL','ON_ARRIVAL','SIMULATED') NOT NULL");
  exec(c,"ALTER TABLE bookings MODIFY payment_status "+statuses+" NOT NULL");
  Map<String,String> fields=new LinkedHashMap<>();
  fields.put("client_id","BIGINT NULL");fields.put("refunded_amount","DECIMAL(12,2) NOT NULL DEFAULT 0");
  fields.put("reserved_refund_amount","DECIMAL(12,2) NOT NULL DEFAULT 0");fields.put("currency","VARCHAR(3) NOT NULL DEFAULT 'MAD'");
  fields.put("provider","VARCHAR(32) NOT NULL DEFAULT 'SANDBOX'");fields.put("provider_reference","VARCHAR(100) NULL");
  fields.put("idempotency_key","VARCHAR(64) NULL");fields.put("active_booking_id","BIGINT NULL");
  fields.put("card_brand","VARCHAR(20) NULL");fields.put("card_last4","VARCHAR(4) NULL");
  fields.put("failure_code","VARCHAR(64) NULL");fields.put("failure_message","VARCHAR(255) NULL");
  fields.put("collected_by_id","BIGINT NULL");
  fields.put("created_at","DATETIME(6) NULL");fields.put("updated_at","DATETIME(6) NULL");fields.put("refunded_at","DATETIME(6) NULL");
  fields.put("version","BIGINT NOT NULL DEFAULT 0");
  for(var f:fields.entrySet())column(c,"payments",f.getKey(),f.getValue());
  index(c,"payments","idx_payment_booking_status","booking_id,status",false);
  // La FK garde un index de support avant suppression de l'ancien OneToOne.
  Set<String> uniqueBooking=new HashSet<>();
  try(ResultSet r=c.getMetaData().getIndexInfo(c.getCatalog(),null,"payments",true,false)){
   while(r.next())if("booking_id".equalsIgnoreCase(r.getString("COLUMN_NAME")))uniqueBooking.add(r.getString("INDEX_NAME"));
  }
  for(String name:uniqueBooking)if(name!=null&&!"PRIMARY".equalsIgnoreCase(name))exec(c,"ALTER TABLE payments DROP INDEX `"+name.replace("`","``")+"`");
  exec(c,"UPDATE payments p JOIN bookings b ON b.id=p.booking_id SET p.client_id=b.client_id,p.method=IF(p.method IN ('ON_ARRIVAL','PAY_ON_ARRIVAL','CASH_ON_ARRIVAL'),'CASH_ON_ARRIVAL','CARD'),p.collected_by_id=p.marked_by_agent_id,p.created_at=COALESCE(p.created_at,b.created_at),p.updated_at=COALESCE(p.updated_at,b.created_at),p.provider_reference=COALESCE(p.provider_reference,CONCAT('SBX-P-',p.id)),p.refunded_amount=IF(p.status='REFUNDED',p.amount,p.refunded_amount)");
  exec(c,"INSERT INTO payments(booking_id,client_id,amount,refunded_amount,reserved_refund_amount,currency,provider,method,status,created_at,updated_at,version) SELECT b.id,b.client_id,b.total,IF(b.payment_status='REFUNDED',b.total,0),0,'MAD',IF(b.total=0,'COMPLIMENTARY','SANDBOX'),IF(b.payment_method='PAY_ON_ARRIVAL','CASH_ON_ARRIVAL','CARD'),CASE WHEN b.total=0 THEN 'PAID' WHEN b.payment_status IN ('PAID','REFUNDED','PARTIALLY_REFUNDED') THEN b.payment_status WHEN b.status IN ('CANCELLED','EXPIRED') THEN 'CANCELLED' WHEN b.status IN ('CONFIRMED','COMPLETED') AND b.payment_method='ONLINE' THEN 'PAID' ELSE 'PENDING' END,b.created_at,b.created_at,0 FROM bookings b WHERE NOT EXISTS(SELECT 1 FROM payments p WHERE p.booking_id=b.id)");
  exec(c,"UPDATE payments SET provider_reference=COALESCE(provider_reference,CONCAT('SBX-P-',id)),active_booking_id=IF(status IN ('PENDING','PROCESSING','PAID','PARTIALLY_REFUNDED'),booking_id,NULL),paid_at=IF(status IN ('PAID','REFUNDED','PARTIALLY_REFUNDED'),COALESCE(paid_at,created_at),paid_at),provider=IF(amount=0,'COMPLIMENTARY',provider)");
  exec(c,"UPDATE bookings b JOIN payments p ON p.booking_id=b.id SET b.payment_status=p.status");
  exec(c,"ALTER TABLE payments MODIFY client_id BIGINT NOT NULL,MODIFY created_at DATETIME(6) NOT NULL,MODIFY updated_at DATETIME(6) NOT NULL");
  index(c,"payments","uk_payment_provider_reference","provider_reference",true);
  index(c,"payments","uk_payment_active_booking","active_booking_id",true);
  index(c,"payments","uk_payment_client_key","client_id,idempotency_key",true);
  index(c,"payments","idx_payment_created","created_at",false);
  exec(c,"CREATE TABLE IF NOT EXISTS payment_events (id BIGINT AUTO_INCREMENT PRIMARY KEY,payment_id BIGINT NOT NULL,from_status "+statuses+" NULL,to_status "+statuses+" NOT NULL,event_type VARCHAR(40),actor_id BIGINT,actor_role VARCHAR(20),details TEXT,created_at DATETIME(6) NOT NULL,CONSTRAINT fk_pe_payment FOREIGN KEY(payment_id) REFERENCES payments(id),CONSTRAINT fk_pe_actor FOREIGN KEY(actor_id) REFERENCES users(id),INDEX idx_payment_event_payment(payment_id,created_at))");
  exec(c,"CREATE TABLE IF NOT EXISTS audit_logs (id BIGINT AUTO_INCREMENT PRIMARY KEY,actor_id BIGINT,actor_role VARCHAR(20),action VARCHAR(64),resource_type VARCHAR(40),resource_id BIGINT,before_json TEXT,after_json TEXT,ip VARCHAR(64),created_at DATETIME(6) NOT NULL,CONSTRAINT fk_audit_actor FOREIGN KEY(actor_id) REFERENCES users(id),INDEX idx_audit_resource(resource_type,resource_id,created_at))");
  exec(c,"CREATE TABLE IF NOT EXISTS webhook_events (id BIGINT AUTO_INCREMENT PRIMARY KEY,provider VARCHAR(32),event_id VARCHAR(100),type VARCHAR(64),payload_hash VARCHAR(64),received_at DATETIME(6) NOT NULL,processed_at DATETIME(6),status VARCHAR(20),CONSTRAINT uk_webhook_provider_event UNIQUE(provider,event_id))");
  exec(c,"CREATE TABLE IF NOT EXISTS idempotency_records (id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id BIGINT NOT NULL,request_key VARCHAR(64) NOT NULL,endpoint VARCHAR(100),request_hash VARCHAR(64),response_status INT,response_body TEXT,payment_id BIGINT,operation_amount DECIMAL(12,2),created_at DATETIME(6) NOT NULL,expires_at DATETIME(6) NOT NULL,CONSTRAINT uk_idempotency_user_key UNIQUE(user_id,request_key),CONSTRAINT fk_idem_user FOREIGN KEY(user_id) REFERENCES users(id),INDEX idx_idempotency_expiry(expires_at))");
  exec(c,"ALTER TABLE payments ADD CONSTRAINT fk_payment_client FOREIGN KEY(client_id) REFERENCES users(id), ADD CONSTRAINT fk_payment_collector FOREIGN KEY(collected_by_id) REFERENCES users(id), ADD CONSTRAINT chk_payment_amount CHECK(amount>0 OR (amount=0 AND provider='COMPLIMENTARY')), ADD CONSTRAINT chk_payment_refund CHECK(refunded_amount>=0 AND reserved_refund_amount>=0 AND refunded_amount+reserved_refund_amount<=amount)");
  exec(c,"INSERT INTO payment_events(payment_id,to_status,event_type,actor_role,details,created_at) SELECT id,status,'MIGRATED','SYSTEM','{}',updated_at FROM payments");
  exec(c,"INSERT INTO audit_logs(actor_role,action,resource_type,resource_id,after_json,created_at) SELECT 'SYSTEM','PAYMENT_MIGRATED','PAYMENT',id,JSON_OBJECT('status',status),updated_at FROM payments");
  for(String table:List.of("payment_events","audit_logs")) for(String action:List.of("UPDATE","DELETE")){
   String trigger="immutable_"+table+"_"+action.toLowerCase(Locale.ROOT);
   try(PreparedStatement q=c.prepareStatement("SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME=?")){
    q.setString(1,trigger);try(ResultSet r=q.executeQuery()){r.next();if(r.getInt(1)>0)continue;}
   }
   exec(c,"CREATE TRIGGER "+trigger+" BEFORE "+action+" ON "+table+" FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Historique append-only'");
  }
 }
 private void exec(Connection c,String sql)throws SQLException{try(Statement s=c.createStatement()){s.execute(sql);}}
 private void column(Connection c,String t,String n,String def)throws SQLException{
  try(ResultSet r=c.getMetaData().getColumns(c.getCatalog(),null,t,n)){if(r.next())return;}exec(c,"ALTER TABLE "+t+" ADD COLUMN "+n+" "+def);
 }
 private void index(Connection c,String t,String n,String cols,boolean unique)throws SQLException{
  try(ResultSet r=c.getMetaData().getIndexInfo(c.getCatalog(),null,t,false,false)){while(r.next())if(n.equalsIgnoreCase(r.getString("INDEX_NAME")))return;}
  exec(c,"CREATE "+(unique?"UNIQUE ":"")+"INDEX "+n+" ON "+t+"("+cols+")");
 }
}

