import styles from './PlayerAvatar.module.css';

export default function PlayerAvatar({
  cardImageId = '1',
  frameShape  = 'circle',
  frameColor  = '#60b8ff',
  size        = 'md',
  name,
}) {
  return (
    <div
      className={styles.outerWrap}
      style={{ '--frame-color': frameColor }}
    >
      <div className={[styles.avatar, styles[`shape_${frameShape}`], styles[`size_${size}`]].join(' ')}>
        <img
          src={`/cards/${cardImageId}.webp`}
          alt={name ?? ''}
          className={styles.img}
          draggable={false}
        />
      </div>
    </div>
  );
}
