package db.migration;
import org.flywaydb.core.api.migration.*;
import java.sql.*;
/** Dates de création et index statistiques ; adoption compatible des schémas Hibernate anciens. */
public class V9__stats_indexes extends BaseJavaMigration {
 @Override public Integer getChecksum(){return 2026103109;}
 @Override public void migrate(Context context)throws Exception{
  Connection c=context.getConnection();
  column(c,"users","created_at","DATETIME(6) NULL");
  column(c,"users","created_at_estimated","BIT NOT NULL DEFAULT 0");
  exec(c,"UPDATE users SET created_at=UTC_TIMESTAMP(6),created_at_estimated=1 WHERE created_at IS NULL");
  exec(c,"ALTER TABLE users MODIFY created_at DATETIME(6) NOT NULL");
  index(c,"users","idx_user_role_created","role,created_at");
  index(c,"bookings","idx_booking_status_created","status,created_at");
  index(c,"bookings","idx_booking_client","client_id");
  index(c,"booking_items","idx_bi_supplier","supplier_id");
  index(c,"booking_items","idx_bi_offer","offer_id");
  index(c,"payments","idx_payment_status","status");
  index(c,"offers","idx_offer_supplier_active","supplier_id,active");
  index(c,"offer_availabilities","idx_availability_offer_end","offer_id,available_until");
 }
 private void column(Connection c,String table,String name,String definition)throws SQLException{
  try(ResultSet r=c.getMetaData().getColumns(c.getCatalog(),null,table,name)){if(r.next())return;}
  exec(c,"ALTER TABLE "+table+" ADD COLUMN "+name+" "+definition);
 }
 private void index(Connection c,String table,String name,String columns)throws SQLException{
  try(ResultSet r=c.getMetaData().getIndexInfo(c.getCatalog(),null,table,false,false)){
   while(r.next())if(name.equalsIgnoreCase(r.getString("INDEX_NAME")))return;
  }
  exec(c,"CREATE INDEX "+name+" ON "+table+"("+columns+")");
 }
 private void exec(Connection c,String sql)throws SQLException{try(Statement s=c.createStatement()){s.execute(sql);}}
}
