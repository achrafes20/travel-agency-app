package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import java.sql.*;
import java.util.*;

/** V1 est sautée lors d'un baseline : ajouter aussi les index aux bases adoptées.
 * Détection par nom pour supporter MySQL et MariaDB sans IF NOT EXISTS spécifique.
 */
public class V3__adopt_legacy_indexes extends BaseJavaMigration {
    @Override public Integer getChecksum() { return 20261030; }
    @Override public void migrate(Context context) throws Exception {
        add(context, "offers", "idx_offer_type_active", "offer_type, active");
        add(context, "offers", "idx_offer_city", "city_id");
        add(context, "offers", "idx_offer_supplier", "supplier_id");
        add(context, "offer_availabilities", "idx_offer_availability_period", "offer_id, available_from, available_until");
        add(context, "bookings", "idx_booking_client_status", "client_id, status");
        add(context, "bookings", "idx_booking_status_created", "status, created_at");
        add(context, "notifications", "idx_notification_user_read", "user_id, is_read");
    }
    private void add(Context context, String table, String index, String columns) throws SQLException {
        Connection connection = context.getConnection();
        Set<String> indexes = new HashSet<>();
        try (ResultSet rs = connection.getMetaData().getIndexInfo(connection.getCatalog(), null, table, false, false)) {
            while (rs.next()) {
                String name = rs.getString("INDEX_NAME");
                if (name != null) indexes.add(name.toLowerCase(Locale.ROOT));
            }
        }
        if (!indexes.contains(index)) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE INDEX " + index + " ON " + table + " (" + columns + ")");
            }
        }
    }
}
