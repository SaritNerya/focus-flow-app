import { useAuth } from "../auth";
import LandingPage from "../pages/LandingPage";
import Layout from "./Layout";
import Loader from "./Loader";

/**
 * הנתיב "/": מחובר — המעטפת הרגילה (Layout) עם דף הבית; לא מחובר — דף הנחיתה.
 * בזמן בדיקת הטוקן מוצג טוען, כדי שמשתמש מחובר לא יראה הבהוב של דף הנחיתה.
 */
export default function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? <Layout /> : <LandingPage />;
}
