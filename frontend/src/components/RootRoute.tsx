import { useAuth } from "../auth";
import LandingPage from "../pages/LandingPage";
import Layout from "./Layout";
import Loader from "./Loader";
import ServerUnavailable from "./ServerUnavailable";

/**
 * הנתיב "/": מחובר — המעטפת הרגילה (Layout) עם דף הבית; לא מחובר — דף הנחיתה.
 * בזמן בדיקת הטוקן מוצג טוען, כדי שמשתמש מחובר לא יראה הבהוב של דף הנחיתה.
 * אם השרת לא זמין בבדיקה — הודעה עם ניסיון חוזר (ולא דף הנחיתה, כי הטוקן עדיין שמור).
 */
export default function RootRoute() {
  const { user, loading, offline } = useAuth();
  if (loading) return <Loader />;
  if (offline) return <ServerUnavailable />;
  return user ? <Layout /> : <LandingPage />;
}
