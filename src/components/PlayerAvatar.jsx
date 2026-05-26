import styles from './PlayerAvatar.module.css';

export default function PlayerAvatar({
  cardImageId  = '1',
  frameColor   = '#60b8ff',
  frameImageId = null,
  size         = 'md',
  name,
}) {
  const hasPngFrame = !!frameImageId;

  if (hasPngFrame) {
    return (
      <div className={[styles.outerWrap, styles[`size_${size}`]].join(' ')}>
        <img
          src={`/cards/${cardImageId}_${frameImageId}.webp`}
          alt={name ?? ''}
          className={styles.compositeImg}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={[styles.outerWrap, styles[`size_${size}`]].join(' ')}
      style={{ '--frame-color': frameColor }}
    >
      <div className={[styles.avatar, styles.shape_rounded].join(' ')}>
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
