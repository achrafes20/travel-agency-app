package com.agence.voyage.config;
import org.flywaydb.core.api.callback.*;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.sql.Statement;
import java.util.*;

/** MariaDB autorise le même nom CHECK dans plusieurs tables. Avant V4, retirer les
 * anciens CHECK que V4 remplace, sans jointure ambiguë entre noms inter-tables.
 * Ne change aucune migration appliquée ; s'exécute uniquement avant V4.
 */
@Component
public class LegacyBookingCheckCompatibility implements Callback {
 public boolean supports(Event event,Context context){
  return event==Event.BEFORE_EACH_MIGRATE && context.getMigrationInfo()!=null
    && "4".equals(context.getMigrationInfo().getVersion().toString());
 }
 public boolean canHandleInTransaction(Event event,Context context){return false;}
 public String getCallbackName(){return "legacy-booking-check-compatibility";}
 public void handle(Event event,Context context){
  try {
   Connection c=context.getConnection();
   boolean maria=(c.getMetaData().getDatabaseProductName()+" "+c.getMetaData().getDatabaseProductVersion()).toLowerCase(Locale.ROOT).contains("maria");
   for(String table:List.of("bookings","offer_availabilities")){
    List<String> names=new ArrayList<>();
    try(PreparedStatement s=c.prepareStatement("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_TYPE='CHECK'")){
     s.setString(1,table);try(ResultSet r=s.executeQuery()){while(r.next())names.add(r.getString(1));}
    }
    for(String name:names)try(Statement s=c.createStatement()){s.execute("ALTER TABLE "+table+(maria?" DROP CONSTRAINT `":" DROP CHECK `")+name.replace("`","``")+"`");}
   }
  }catch(SQLException e){throw new IllegalStateException("Préparation des contraintes historiques avant V4 impossible",e);}
 }
}

