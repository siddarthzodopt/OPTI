"use client";

import { useRouter } from "next/navigation";
import styles from "./style.module.css";

export default function SubscriptionsPage() {
  const router = useRouter();

  const plans = [
    { id: 1, name: "Basic", price: "₹199 / month" },
    { id: 2, name: "Pro", price: "₹499 / month" },
    { id: 3, name: "Enterprise", price: "₹999 / month" },
  ];

  const handleChoosePlan = (planId: number) => {
    // later: call backend to activate subscription
    // now: redirect to admin dashboard
    router.push("/admin");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Choose Your Subscription</h1>
      <p className={styles.subtitle}>Select a plan to continue</p>

      <div className={styles.grid}>
        {plans.map((p) => (
          <div key={p.id} className={styles.card}>
            <h2 className={styles.plan}>{p.name}</h2>
            <p className={styles.price}>{p.price}</p>
            <button
              className={styles.button}
              onClick={() => handleChoosePlan(p.id)}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
