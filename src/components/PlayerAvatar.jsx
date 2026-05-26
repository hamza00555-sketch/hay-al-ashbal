import styles from './PlayerAvatar.module.css';

export default function PlayerAvatar({
  cardImageId  = '1',
  frameShape   = 'circle',
  frameColor   = '#60b8ff',
  frameImageId = null,   // PNG overlay frame e.g. 'fr_c1'
  size         = 'md',
  name,
}) {
  const hasPngFrame = !!frameImageId;

  return (
    <div
      className={styles.outerWrap}
      style={{ '--frame-color': hasPngFrame ? 'transparent' : frameColor }}
    >
      <div className={[
        styles.avatar,
        hasPngFrame ? styles.shape_circle : styles[`shape_${frameShape}`],
        styles[`size_${size}`],
        hasPngFrame ? styles.noBorder : '',
      ].join(' ')}>
        <img
          src={`/cards/${cardImageId}.webp`}
          alt={name ?? ''}
          className={styles.img}
          draggable={false}
        />
        {hasPngFrame && (
          <img
            src={`/frames/${frameImageId}.webp`}
            alt=""
            className={styles.frameOverlay}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
