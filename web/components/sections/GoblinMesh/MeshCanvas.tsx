"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { MESH_EDGES, MESH_NODES, MESH_VIEW, nodePosition } from "./mesh.data";
import styles from "./GoblinMesh.module.css";

const byId = (id: string) => MESH_NODES.find((n) => n.id === id)!;

/**
 * The animated graph stage — the one interactive island in this section.
 * Advances an "active" node every 1.1s; the matching edge lights up and a
 * packet travels it. Respects prefers-reduced-motion (holds on the first node,
 * no travelling packet).
 */
export const MeshCanvas = () => {
  const [active, setActive] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimate(false);
      return;
    }
    const id = setInterval(() => setActive((i) => (i + 1) % MESH_NODES.length), 1100);
    return () => clearInterval(id);
  }, []);

  const activeId = MESH_NODES[active].id;
  const [edgeFrom, edgeTo] = MESH_EDGES[active % MESH_EDGES.length];
  const total = String(MESH_NODES.length).padStart(2, "0");

  return (
    <div className={styles.stage}>
      <div className={styles.gridBg} />

      <div className={styles.head}>
        <span className={styles.headLeft}>goblin-graph.runtime</span>
        <span className={styles.headRight}>
          ⚡ executing · {String(active + 1).padStart(2, "0")} / {total}
        </span>
      </div>

      <div className={styles.svgWrap}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${MESH_VIEW.width + 200} ${MESH_VIEW.height + 60}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {MESH_EDGES.map(([from, to]) => {
            const a = nodePosition(byId(from));
            const b = nodePosition(byId(to));
            const on = edgeFrom === from && edgeTo === to;
            return (
              <g key={`${from}-${to}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={on ? "var(--lime)" : "var(--line-2)"}
                  strokeWidth={on ? 2 : 1}
                  strokeDasharray={on ? "0" : "4 5"}
                />
                {on && animate && (
                  <circle r="4" fill="var(--lime)">
                    <animateMotion
                      dur="1.1s"
                      repeatCount="indefinite"
                      path={`M${a.x},${a.y} L${b.x},${b.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {MESH_NODES.map((node) => (
          <div
            key={node.id}
            className={clsx(styles.node, activeId === node.id && styles.nodeActive)}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <span className={styles.pin} />
            <div className={styles.nodeLabel}>{node.label}</div>
            <div className={styles.nodeValue}>{node.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <span>
          <i className={styles.legendOn} /> active path
        </span>
        <span>
          <i className={styles.legendIdle} /> idle edge
        </span>
        <span>
          <i className={styles.legendGate} /> engineer review gate
        </span>
      </div>
    </div>
  );
};
