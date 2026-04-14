import styles from './Skeleton.module.css';

export function SkeletonLine({ width = '100%', height = '14px', radius = '6px', style = {} }) {
  return <div className={styles.bone} style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <SkeletonLine width="52px" height="52px" radius="10px" />
        <div className={styles.col}>
          <SkeletonLine width="40%" height="13px" />
          <SkeletonLine width="60%" height="11px" style={{ marginTop: 6 }} />
        </div>
      </div>
      <SkeletonLine width="80%" height="12px" style={{ marginTop: 10 }} />
      <SkeletonLine width="55%" height="12px" style={{ marginTop: 6 }} />
      <div className={styles.row} style={{ marginTop: 12, gap: 8 }}>
        <SkeletonLine width="90px" height="30px" radius="8px" />
        <SkeletonLine width="70px" height="30px" radius="8px" />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonLeaderRow() {
  return (
    <div className={styles.leaderRow}>
      <SkeletonLine width="28px" height="28px" radius="50%" />
      <SkeletonLine width="36px" height="36px" radius="8px" style={{ marginLeft: 8 }} />
      <div className={styles.col} style={{ flex: 1, marginLeft: 10 }}>
        <SkeletonLine width="50%" height="13px" />
        <SkeletonLine width="35%" height="11px" style={{ marginTop: 5 }} />
      </div>
      <SkeletonLine width="40px" height="22px" radius="20px" />
    </div>
  );
}
