import styles from './SpeechBubble.module.css';

export default function SpeechBubble({ text, color = '#fff', side = 'top' }) {
  if (!text) return null;
  return (
    <div
      className={[styles.bubble, styles[side]].join(' ')}
      style={{ '--bubble-color': color }}
    >
      {text}
    </div>
  );
}
