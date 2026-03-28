/**
 * Animated RPG progress bar for the dungeon summoning/loading screen.
 * Dark premium aesthetic with gradient fill, shimmer sweep, and outer glow.
 */
export class ProgressBar {
  /**
   * @param {Phaser.Scene} scene - The Phaser scene to attach to
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} width - Total bar width
   * @param {number} height - Total bar height
   */
  constructor(scene, x, y, width, height) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.progress = 0;
    this._displayProgress = 0; // smoothed value used for rendering
    this._shimmerOffset = 0;

    // Inset for the fill area (padding inside the track)
    this._pad = 2;
    this._fillMaxW = this.width - this._pad * 2;
    this._fillH = this.height - this._pad * 2;

    // Top-left corner of the track rect (for drawing convenience)
    this._left = this.x - this.width / 2;
    this._top = this.y - this.height / 2;

    this._createGraphics();
    this._createText();

    // Register update handler so shimmer animates continuously
    this._updateHandler = this._update.bind(this);
    this.scene.events.on('update', this._updateHandler);
  }

  // ── Visual Construction ──────────────────────────────────────

  _createGraphics() {
    // Layer order (bottom to top): glow, track, fill, shimmer, frame
    this.glowGfx = this.scene.add.graphics().setDepth(98);
    this.trackGfx = this.scene.add.graphics().setDepth(99);
    this.fillGfx = this.scene.add.graphics().setDepth(100);
    this.shimmerGfx = this.scene.add.graphics().setDepth(101);
    this.frameGfx = this.scene.add.graphics().setDepth(102);

    this._drawTrack();
    this._drawFrame();
    this._drawFill();
  }

  _createText() {
    this.label = this.scene.add.text(this.x, this.y, '0%', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
      .setOrigin(0.5)
      .setDepth(103);
  }

  // ── Track (recessed dark background) ─────────────────────────

  _drawTrack() {
    const g = this.trackGfx;
    g.clear();

    // Border
    g.fillStyle(0x2a2a4e, 1);
    g.fillRoundedRect(this._left, this._top, this.width, this.height, 4);

    // Inner fill area
    g.fillStyle(0x0a0a1a, 1);
    g.fillRoundedRect(
      this._left + 1, this._top + 1,
      this.width - 2, this.height - 2,
      3
    );
  }

  // ── Decorative Frame (gold accent lines) ─────────────────────

  _drawFrame() {
    const g = this.frameGfx;
    g.clear();

    const lineAlpha = 0.55;
    const inset = 1;

    // Top gold line
    g.fillStyle(0xd4af37, lineAlpha);
    g.fillRect(this._left + inset + 3, this._top, this.width - (inset + 3) * 2, 1);

    // Bottom gold line
    g.fillStyle(0xd4af37, lineAlpha);
    g.fillRect(this._left + inset + 3, this._top + this.height - 1, this.width - (inset + 3) * 2, 1);
  }

  // ── Gradient Fill (deep blue → gold) ─────────────────────────

  _drawFill() {
    const g = this.fillGfx;
    g.clear();

    const fillW = Math.round(this._fillMaxW * this._displayProgress);
    if (fillW <= 0) return;

    const fx = this._left + this._pad;
    const fy = this._top + this._pad;
    const fh = this._fillH;

    // Draw vertical slices with interpolated colour
    const sliceCount = Math.max(fillW, 1);
    for (let i = 0; i < sliceCount; i++) {
      const t = fillW > 1 ? i / (fillW - 1) : 0; // 0..1 across the filled region
      const color = this._lerpColor(0x1a3080, 0xd4af37, t);
      g.fillStyle(color, 1);
      g.fillRect(fx + i, fy, 1, fh);
    }
  }

  // ── Outer Glow ───────────────────────────────────────────────

  _drawGlow() {
    const g = this.glowGfx;
    g.clear();

    const fillW = Math.round(this._fillMaxW * this._displayProgress);
    if (fillW <= 2) return;

    const fx = this._left + this._pad;
    const fy = this._top + this._pad;
    const fh = this._fillH;

    // Semi-transparent gold glow slightly larger than the fill
    const glowExpand = 3;
    g.fillStyle(0xd4af37, 0.08);
    g.fillRect(
      fx - glowExpand,
      fy - glowExpand,
      fillW + glowExpand * 2,
      fh + glowExpand * 2
    );

    // Inner brighter glow
    g.fillStyle(0xd4af37, 0.05);
    g.fillRect(
      fx - glowExpand * 2,
      fy - glowExpand * 2,
      fillW + glowExpand * 4,
      fh + glowExpand * 4
    );
  }

  // ── Shimmer Highlight ────────────────────────────────────────

  _drawShimmer() {
    const g = this.shimmerGfx;
    g.clear();

    const fillW = Math.round(this._fillMaxW * this._displayProgress);
    if (fillW <= 8) return;

    const fx = this._left + this._pad;
    const fy = this._top + this._pad;
    const fh = this._fillH;

    // Shimmer position loops across the filled width
    const shimmerX = fx + (this._shimmerOffset % fillW);
    const shimmerW = 4;

    // Only draw if shimmer is within the filled portion
    if (shimmerX + shimmerW <= fx + fillW) {
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(shimmerX, fy, shimmerW, fh);

      // Softer leading/trailing edge
      g.fillStyle(0xffffff, 0.08);
      g.fillRect(shimmerX - 2, fy, 2, fh);
      g.fillRect(shimmerX + shimmerW, fy, 2, fh);
    }
  }

  // ── Scene Update Loop ────────────────────────────────────────

  _update(_time, delta) {
    if (!this.scene || !this.fillGfx) return;

    const dt = delta / 1000;
    const fillW = Math.round(this._fillMaxW * this._displayProgress);

    // Advance shimmer (~80px/s sweep speed)
    if (fillW > 8) {
      this._shimmerOffset += 80 * dt;
      if (this._shimmerOffset > fillW + 8) {
        this._shimmerOffset = -8;
      }
    }

    this._drawShimmer();
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * Set the target progress (0 to 1). Tweens smoothly to the new value.
   * @param {number} value - Progress between 0 and 1
   */
  setProgress(value) {
    this.progress = Phaser.Math.Clamp(value, 0, 1);

    // Tween the display progress for smooth animation
    if (this._tween) {
      this._tween.stop();
    }

    this._tween = this.scene.tweens.add({
      targets: this,
      _displayProgress: this.progress,
      duration: 200,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        this._drawFill();
        this._drawGlow();
        this.label.setText(`${Math.round(this._displayProgress * 100)}%`);
      },
      onComplete: () => {
        this._drawFill();
        this._drawGlow();
        this.label.setText(`${Math.round(this._displayProgress * 100)}%`);
      }
    });
  }

  /**
   * Remove all graphics and clean up event listeners.
   */
  destroy() {
    // Detach from scene update loop
    if (this.scene && this.scene.events) {
      this.scene.events.off('update', this._updateHandler);
    }

    if (this._tween) {
      this._tween.stop();
      this._tween = null;
    }

    const objects = [
      this.glowGfx, this.trackGfx, this.fillGfx,
      this.shimmerGfx, this.frameGfx, this.label
    ];
    for (const obj of objects) {
      if (obj) obj.destroy();
    }

    this.glowGfx = null;
    this.trackGfx = null;
    this.fillGfx = null;
    this.shimmerGfx = null;
    this.frameGfx = null;
    this.label = null;
    this.scene = null;
  }

  // ── Colour Utilities ─────────────────────────────────────────

  /**
   * Linearly interpolate between two hex colours.
   * @param {number} a - Start colour (0xRRGGBB)
   * @param {number} b - End colour (0xRRGGBB)
   * @param {number} t - Interpolation factor (0..1)
   * @returns {number} Interpolated colour
   */
  _lerpColor(a, b, t) {
    const ar = (a >> 16) & 0xff;
    const ag = (a >> 8) & 0xff;
    const ab = a & 0xff;

    const br = (b >> 16) & 0xff;
    const bg = (b >> 8) & 0xff;
    const bb = b & 0xff;

    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);

    return (r << 16) | (g << 8) | bl;
  }
}
