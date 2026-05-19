import styles from './GameLog.module.css';

function colorize(text, players) {
  if (!players || !text) return text;
  let result = text;
  const sorted = [...players].sort((a, b) => b.name.length - a.name.length);
  for (const p of sorted) {
    const escaped = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const color = p.profile?.frameColor ?? '#60b8ff';
    result = result.replace(
      new RegExp(escaped, 'g'),
      `<span style="color:${color};font-weight:700">${p.name}</span>`
    );
  }
  return result;
}

export default function GameLog({ entries, players }) {
  const recent = entries.slice(-4).reverse();
  return (
    <div className={styles.log}>
      {recent.map(e => {
        const raw = e.reason ?? e.text ?? JSON.stringify(e);
        return (
          <div
            key={e.id}
            className={styles.entry}
            dangerouslySetInnerHTML={{ __html: colorize(raw, players) }}
          />
        );
      })}
    </div>
  );
}
