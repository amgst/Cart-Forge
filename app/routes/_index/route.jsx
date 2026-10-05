import { redirect } from "react-router";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function App() {
  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Shopify cart management</p>
        <h1 className={styles.heading}>Cart Forge</h1>
        <p className={styles.text}>
          Create stronger cart experiences and manage your store setup from one
          focused workspace.
        </p>
        <p className={styles.text}>
          Open Cart Forge from the Apps section in your Shopify admin. To install
          the app, use its Shopify App Store listing.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Fast setup</strong>
            <span>Connect your Shopify store and start configuring quickly.</span>
          </li>
          <li>
            <strong>Native workflow</strong>
            <span>Work securely inside Shopify Admin with familiar controls.</span>
          </li>
          <li>
            <strong>Store focused</strong>
            <span>Keep cart tools and product actions organized in one place.</span>
          </li>
        </ul>
        <p className={styles.footer}>
          <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
