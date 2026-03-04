import java.sql.*;

public class CreateTestUser {
    public static void main(String[] args) throws Exception {
        try (Connection conn = DriverManager.getConnection(
                "jdbc:postgresql://localhost:5432/dicoscan", "postgres", "12345")) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO users (id, email, display_name, subscription_tier, profile_completed, created_at, updated_at) "
                            +
                            "VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'test@dico.com', 'Test Premium', 'PREMIUM', false, NOW(), NOW()) "
                            +
                            "ON CONFLICT (email) DO UPDATE SET subscription_tier = 'PREMIUM'")) {
                ps.executeUpdate();
                System.out.println("Test PREMIUM user created: 11111111-1111-1111-1111-111111111111");
            }
        }
    }
}
