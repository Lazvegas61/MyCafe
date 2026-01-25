import React from "react";
import "./BorcTransferModal.css";

export default function BorcTransferModal({
  open,
  onClose,
  onConfirm,
  kaynakMusteri,
  musteriler,
  transferTutar,
  setTransferTutar,
  transferMusteriId,
  setTransferMusteriId,
  transferNot,
  setTransferNot
}) {
  if (!open) return null;

  return (
    <div className="mc-modal-overlay">
      <div className="mc-modal">

        {/* HEADER */}
        <div className="mc-modal-header">
          <h2>🔄 BORÇ TRANSFERİ</h2>
          <button className="mc-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="mc-modal-body">

          {/* MÜŞTERİLER */}
          <div className="mc-transfer-row">
            <div className="mc-transfer-box source">
              <span className="label">Kaynak Müşteri</span>
              <strong>{kaynakMusteri?.adSoyad}</strong>
              <span className="amount">
                Kalan Borç: {kaynakMusteri?.netBorc?.toFixed(2)} ₺
              </span>
            </div>

            <div className="mc-transfer-arrow">➜</div>

            <div className="mc-transfer-box target">
              <span className="label">Hedef Müşteri</span>
              <select
                value={transferMusteriId}
                onChange={(e) => setTransferMusteriId(e.target.value)}
              >
                <option value="">Müşteri Seçiniz</option>
                {musteriler
                  .filter(m => m.id !== kaynakMusteri?.id)
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.adSoyad}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* TUTAR */}
          <div className="mc-form-group">
            <label>Transfer Tutarı (₺)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={transferTutar}
              onChange={(e) => setTransferTutar(e.target.value)}
            />
          </div>

          {/* AÇIKLAMA */}
          <div className="mc-form-group">
            <label>Açıklama</label>
            <textarea
              placeholder="Borç transferi açıklaması..."
              value={transferNot}
              onChange={(e) => setTransferNot(e.target.value)}
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="mc-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            İPTAL
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            ONAYLA
          </button>
        </div>

      </div>
    </div>
  );
}
