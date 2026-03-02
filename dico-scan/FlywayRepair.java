import java.sql.*;

/**
 * One-time utility: Remove failed V2 Flyway migration entry
 * so Spring Boot can re-run V2 correctly on next startup.
 * Run: java -cp . FlywayRepair
 */
public class FlywayRepair {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/dicoscan";
        String user = "postgres";
        String password = "12345";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            // First, check what's there
            try (Statement st = conn.createStatement()) {
                ResultSet rs = st.executeQuery(
                        "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank");
                System.out.println("Current Flyway history:");
                while (rs.next()) {
                    System.out.printf("  v%s - %s - success=%s%n",
                            rs.getString("version"), rs.getString("description"), rs.getBoolean("success"));
                }
            }
            // Delete failed V2 entry
            try (PreparedStatement ps = conn
                    .prepareStatement("DELETE FROM flyway_schema_history WHERE version = '2' AND success = false")) {
                int rows = ps.executeUpdate();
                System.out.println("Deleted " + rows + " failed V2 migration entry(ies).");
            }
            System.out.println("Done! Restart Spring Boot now.");
        }
    }
}
