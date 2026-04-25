import { redirect } from "next/navigation";

// Página /admin/configuracion eliminada: era redundante con /admin.
// Mantenemos este redirect para no romper enlaces viejos en deploys cacheados.
export default function AdminConfiguracionRedirect() {
  redirect("/admin");
}
