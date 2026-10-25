import { useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import { useAuth } from "./AuthContext";

const PUBLIC_PATHS = ["/login", "/register"];

export default function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  const router = useIonRouter();
  const pathname = router.routeInfo.pathname;

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!isAuthenticated && !isPublic) router.push("/login", "root", "replace");
    if (isAuthenticated && isPublic) router.push("/home", "root", "replace");
  }, [isAuthenticated, pathname]);

  return null;
}