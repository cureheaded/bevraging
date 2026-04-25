import { isAdmin } from "@/lib/session";
import AdminLogin from "./admin-login";
import AdminDashboard from "./admin-dashboard";

export default async function AdminPage() {
  const ok = await isAdmin();
  if (!ok) {
    return (
      <div className="container">
        <div className="card">
          <h1>Admin</h1>
          <AdminLogin />
        </div>
      </div>
    );
  }
  return (
    <div className="container-wide">
      <AdminDashboard />
    </div>
  );
}
