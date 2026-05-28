import styles from './PlayerAvatar.module.css';

export default function PlayerAvatar({
  cardImageId  = '1',
  frameColor   = '#60b8ff',
  frameImageId = null,
  size         = 'md',
  name,
}) {
  return (
    <div
      className={[styles.outerWrap, styles[`size_${size}`]].join(' ')}
      style={{ '--frame-color': frameColor }}
    >
      {frameImageId && (
        <img
          src={`/frames/${frameImageId}.webp`}
          alt=""
          className={styles.frameBack}
          draggable={false}
        />
      )}
      <div className={styles.avatar}>
        {cardImageId ? (
          <img
            src={`/cards/${cardImageId}.webp`}
            alt={name ?? ''}
            className={styles.img}
            draggable={false}
          />
        ) : (
          <div className={styles.avatarDefault} role="img" aria-label={name ?? 'لاعب'} />
        )}
      </div>
    </div>
  );
}
