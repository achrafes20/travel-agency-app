package db.migration;

import org.flywaydb.core.api.migration.*;
import java.sql.*;
import java.math.*;
import java.util.*;

/** Complète les bundles historiques : leurs lignes fournisseur manquaient au modèle initial.
 * Le total parent reste inchangé ; seuls ses montants figés sont répartis.
 */
public class V5__legacy_bundle_items extends BaseJavaMigration {
 @Override public Integer getChecksum(){return 202610302;}
 @Override public void migrate(Context context)throws Exception{
  Connection c=context.getConnection();
  List<Long> parents=new ArrayList<>();
  try(Statement s=c.createStatement();ResultSet r=s.executeQuery("SELECT i.id FROM booking_items i WHERE i.bundle_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM booking_items child WHERE child.parent_item_id=i.id) ORDER BY i.id")){
   while(r.next())parents.add(r.getLong(1));
  }
  for(Long id:parents)backfill(c,id);
 }
 private void backfill(Connection c,Long id)throws SQLException{
  long booking,bundle;int quantity;BigDecimal total;Timestamp start,end;String travel;
  try(PreparedStatement s=c.prepareStatement("SELECT booking_id,bundle_id,quantity,line_total,service_start_at,service_end_at,travel_criteria FROM booking_items WHERE id=?")){
   s.setLong(1,id);try(ResultSet r=s.executeQuery()){r.next();booking=r.getLong(1);bundle=r.getLong(2);quantity=r.getInt(3);total=r.getBigDecimal(4);start=r.getTimestamp(5);end=r.getTimestamp(6);travel=r.getString(7);}
  }
  record OfferRow(long id,long supplier,String title,BigDecimal price){}
  List<OfferRow> offers=new ArrayList<>();
  try(PreparedStatement s=c.prepareStatement("SELECT o.id,o.supplier_id,o.title,o.base_price FROM bundle_offers bo JOIN offers o ON o.id=bo.offer_id WHERE bo.bundle_id=? ORDER BY o.id")){
   s.setLong(1,bundle);try(ResultSet r=s.executeQuery()){while(r.next())offers.add(new OfferRow(r.getLong(1),r.getLong(2),r.getString(3),BigDecimal.valueOf(r.getDouble(4))));}
  }
  BigDecimal sum=offers.stream().map(OfferRow::price).reduce(BigDecimal.ZERO,BigDecimal::add),remaining=total;
  for(int index=0;index<offers.size();index++){
   OfferRow o=offers.get(index);BigDecimal amount=index==offers.size()-1?remaining:sum.signum()==0?total.divide(BigDecimal.valueOf(offers.size()),2,RoundingMode.HALF_UP):total.multiply(o.price()).divide(sum,2,RoundingMode.HALF_UP);
   remaining=remaining.subtract(amount);
   try(PreparedStatement s=c.prepareStatement("INSERT INTO booking_items(booking_id,offer_id,parent_item_id,supplier_id,title_snapshot,quantity,unit_price,line_total,service_start_at,service_end_at,travel_criteria) VALUES (?,?,?,?,?,?,?,?,?,?,?)")){
    s.setLong(1,booking);s.setLong(2,o.id());s.setLong(3,id);s.setLong(4,o.supplier());s.setString(5,o.title());s.setInt(6,quantity);s.setBigDecimal(7,amount.divide(BigDecimal.valueOf(quantity),2,RoundingMode.HALF_UP));s.setBigDecimal(8,amount);s.setTimestamp(9,start);s.setTimestamp(10,end);s.setString(11,travel);s.executeUpdate();
   }
  }
 }
}

