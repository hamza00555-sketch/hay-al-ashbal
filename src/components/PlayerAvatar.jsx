import styles from './PlayerAvatar.module.css';

export default function PlayerAvatar({
  cardImageId  = '1',
  frameColor   = '#60b8ff',
  frameImageId = null,
  size         = 'md',
  name,
}) {
  const hasPngFrame = !!frameImageId;

  return (
    <div
      className={[styles.outerWrap, styles[`size_${size}`]].join(' ')}
      style={{ '--frame-color': hasPngFrame ? 'transparent' : frameColor }}
    >
      {/* character image — clipped to rounded rectangle */}
      <div className={[
        styles.avatar,
        hasPngFrame ? styles.shape_circle : styles.shape_rounded,
        hasPngFrame ? styles.noBorder : '',
      ].join(' ')}>
        <img
          src={`/cards/${cardImageId}.webp`}
          alt={name ?? ''}
          className={styles.img}
          draggable={false}
        />
      </div>
      {/* PNG frame overlay — sits outside the clip */}
      {hasPngFrame && (
        <img
          src={`/frames/${frameImageId}.webp`}
          alt=""
          className={styles.frameOverlay}
          draggable={false}
        />
      )}
    </div>
  );
}
