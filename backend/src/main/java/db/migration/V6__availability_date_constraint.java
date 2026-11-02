package db.migration;
import org.flywaydb.core.api.migration.*;
import java.sql.*;
/** Rétablit la contrainte de dates après normalisation des anciens CHECK MariaDB. */
public class V6__availability_date_constraint extends BaseJavaMigration {
 @Override public Integer getChecksum(){return 202610303;}
 @Override public void migrate(Context context)throws Exception {
  Connection c=context.getConnection();boolean exists;
  try(PreparedStatement s=c.prepareStatement("SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='offer_availabilities' AND CONSTRAINT_NAME='chk_availability_dates'")){
   try(ResultSet r=s.executeQuery()){r.next();exists=r.getInt(1)>0;}
  }
  if(!exists)try(Statement s=c.createStatement()){s.execute("ALTER TABLE offer_availabilities ADD CONSTRAINT chk_availability_dates CHECK(available_until > available_from)");}
 }
}

