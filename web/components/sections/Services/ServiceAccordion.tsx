"use client";

import { useState } from "react";
import clsx from "clsx";
import type { Service } from "./services.data";
import styles from "./Services.module.css";

/** First word gets the lime accent, like the original. */
const Title = ({ title }: { title: string }) => {
  const [first, ...rest] = title.split(" ");
  return (
    <span className={styles.title}>
      <em className={styles.titleAccent}>{first} </em>
      {rest.join(" ")}
    </span>
  );
};

export const ServiceAccordion = ({ services }: { services: Service[] }) => {
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.body}>
      {services.map((service, i) => {
        const isOpen = open === i;
        const toggle = () => setOpen(isOpen ? -1 : i);
        return (
          <div
            key={service.num}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            className={styles.row}
            data-cursor="./expand"
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }}
          >
            <span className={styles.num}>{service.num}</span>
            <Title title={service.title} />
            <div className={styles.detail}>
              <div className={styles.lead}>{service.lead}</div>
              <div className={clsx(styles.desc, isOpen && styles.descOpen)}>
                <ul className={styles.descList}>
                  {service.items.map((item) => (
                    <li key={item} className={styles.descItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <span className={clsx(styles.toggle, isOpen && styles.toggleOpen)} aria-hidden="true">
              +
            </span>
          </div>
        );
      })}
    </div>
  );
};
