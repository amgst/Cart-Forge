import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Shopify cart management</p>
        <h1 className={styles.heading}>Cart Forge</h1>
        <p className={styles.text}>
          Create stronger cart experiences and manage your store setup from one
          focused workspace.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="your-store.myshopify.com"
                autoComplete="url"
                required
              />
              <span className={styles.hint}>Use your .myshopify.com domain</span>
            </label>
            <button className={styles.button} type="submit">
              Continue
            </button>
          </Form>
        )}
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
      </div>
    </div>
  );
}
