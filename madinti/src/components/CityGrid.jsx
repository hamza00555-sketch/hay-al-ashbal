import { useState } from 'react';
import { BUILDINGS } from '../constants/buildings.js';
import styles from './CityGrid.module.css';

const GRID_SIZE = 15;

function GridCell({ cell, building, isSelected, isHighlight, isPolluted, buildMode, onClick }) {
  const def = building ? BUILDINGS[building.typeId] : null;
  const isEmpty = !building;

  let statusDot = null;
  if (def) {
    if (def.category === 'residential') {
      const dotColor = building.status === 'rented' ? '#4CAF50' : building.status === 'for_sale' ? '#f44336' : '#FFD700';
      statusDot = <span className={styles.dot} style={{ background: dotColor }} />;
    }
  }

  return (
    <div
      className={[
        styles.cell,
        isSelected ? styles.selected : '',
        isHighlight ? styles.highlight : '',
        isPolluted ? styles.polluted : '',
        buildMode && isEmpty ? styles.buildable : '',
      ].join(' ')}
      onClick={onClick}
    >
      {def ? (
        <>
          <span className={styles.emoji}>{def.emoji}</span>
          {statusDot}
          {building?.isOnFire && <span className={styles.fire}>🔥</span>}
          {building?.isPowered === false && <span className={styles.power}>⚡</span>}
        </>
      ) : (
        <span className={styles.empty}>{buildMode ? '+' : ''}</span>
      )}
    </div>
  );
}

export default function CityGrid({ grid, buildings, selectedCellId, onCellClick, buildMode, pendingTypeId }) {
  const [zoom, setZoom] = useState(1);

  // compute highlight and pollution cells based on hovering
  const [hoveredId, setHoveredId] = useState(null);

  const highlightSet = new Set();
  const pollutedSet = new Set();

  if (buildMode && pendingTypeId && hoveredId !== null) {
    const def = BUILDINGS[pendingTypeId];
    const cell = grid[hoveredId];
    if (cell && def) {
      if (def.effectRadius > 0) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const dist = Math.max(Math.abs(cell.row - r), Math.abs(cell.col - c));
            if (dist <= def.effectRadius && dist > 0) {
              highlightSet.add(r * GRID_SIZE + c);
            }
          }
        }
      }
      if (def.pollutionRadius > 0) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const dist = Math.max(Math.abs(cell.row - r), Math.abs(cell.col - c));
            if (dist <= def.pollutionRadius && dist > 0) {
              pollutedSet.add(r * GRID_SIZE + c);
            }
          }
        }
      }
    }
  }

  // Show effect radius of selected building
  if (selectedCellId !== null && !buildMode) {
    const b = buildings[`cell-${selectedCellId}`];
    if (b) {
      const def = BUILDINGS[b.typeId];
      const cell = grid[selectedCellId];
      if (def.effectRadius > 0) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const dist = Math.max(Math.abs(cell.row - r), Math.abs(cell.col - c));
            if (dist <= def.effectRadius && dist > 0) highlightSet.add(r * GRID_SIZE + c);
          }
        }
      }
      if (def.pollutionRadius > 0) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const dist = Math.max(Math.abs(cell.row - r), Math.abs(cell.col - c));
            if (dist <= def.pollutionRadius && dist > 0) pollutedSet.add(r * GRID_SIZE + c);
          }
        }
      }
    }
  }

  function handleWheel(e) {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(2.5, z - e.deltaY * 0.001)));
  }

  return (
    <div className={styles.wrapper} onWheel={handleWheel}>
      <div className={styles.scaler} style={{ transform: `scale(${zoom})` }}>
        <div className={styles.grid}>
          {grid.map(cell => {
            const b = buildings[`cell-${cell.id}`] || null;
            return (
              <GridCell
                key={cell.id}
                cell={cell}
                building={b}
                isSelected={cell.id === selectedCellId}
                isHighlight={highlightSet.has(cell.id)}
                isPolluted={pollutedSet.has(cell.id)}
                buildMode={buildMode}
                onClick={() => onCellClick(cell.id)}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.zoomControls}>
        <button onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}>+</button>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>−</button>
      </div>
    </div>
  );
}
