// src/pages/KategoriYonetimi.jsx
import React, { useEffect, useState } from "react";

const LOCAL_KEY = "mc_kategoriler";

function sortByName(list) {
  return [...list].sort((a, b) =>
    a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
  );
}

function getNextId(categories) {
  if (!categories.length) return 1;
  return Math.max(...categories.map((c) => c.id || 0)) + 1;
}

// Mevcut kategorileri normalize eder ve gerekiyorsa SİPARİŞ YEMEK ekler
function prepareCategories(list) {
  const normalized = (list || []).map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId ?? null,
    isSiparisYemek: !!c.isSiparisYemek,
    hideStock: !!c.hideStock,
    hideInReports: !!c.hideInReports,
    manualPriceEachTime: !!c.manualPriceEachTime,
  }));

  const hasSiparis = normalized.some((c) => c.isSiparisYemek);

  // Eğer hiç "SİPARİŞ YEMEK" kategorisi yoksa, bir tane ekle (kuralları sabit)
  if (!hasSiparis) {
    const maxId = normalized.length
      ? Math.max(...normalized.map((c) => c.id || 0))
      : 0;

    const siparisYemek = {
      id: maxId + 1 || 1,
      name: "SİPARİŞ YEMEK",
      parentId: null,
      isSiparisYemek: true,
      hideStock: true,
      hideInReports: true,
      manualPriceEachTime: true,
    };

    normalized.unshift(siparisYemek);
  }

  return normalized;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);

    // Daha önce kayıt yoksa sadece SİPARİŞ YEMEK oluştur
    if (!raw) {
      const initial = [
        {
          id: 1,
          name: "SİPARİŞ YEMEK",
          parentId: null,
          isSiparisYemek: true,
          hideStock: true,
          hideInReports: true,
          manualPriceEachTime: true,
        },
      ];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortByName(parsed);
  } catch {
    return [];
  }
}


function saveToStorage(categories) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(categories));
}

const KategoriYonetimi = () => {
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [isSiparisYemek, setIsSiparisYemek] = useState(false);
  const [hideStock, setHideStock] = useState(false);
  const [hideInReports, setHideInReports] = useState(false);
  const [manualPriceEachTime, setManualPriceEachTime] = useState(false);

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info"); // info | success | error

  useEffect(() => {
    const data = loadFromStorage();
    setCategories(sortByName(data));
  }, []);

  // Mesaj gösterimi
  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    if (text) {
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setName("");
    setParentId("");
    setIsSiparisYemek(false);
    setHideStock(false);
    setHideInReports(false);
    setManualPriceEachTime(false);
  };

  const fillFormFromCategory = (cat) => {
    setSelectedId(cat.id);
    setName(cat.name);
    setParentId(cat.parentId ?? "");
    setIsSiparisYemek(!!cat.isSiparisYemek);
    setHideStock(!!cat.hideStock);
    setHideInReports(!!cat.hideInReports);
    setManualPriceEachTime(!!cat.manualPriceEachTime);
  };

  // SİPARİŞ YEMEK tipi seçildiğinde otomatik kurallar
  useEffect(() => {
    if (isSiparisYemek) {
      setHideStock(true);
      setHideInReports(true);
      setManualPriceEachTime(true);
    }
  }, [isSiparisYemek]);

  const handleSelectCategory = (id) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    fillFormFromCategory(cat);
  };

  const hasChildren = (id) => {
    return categories.some((c) => c.parentId === id);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showMessage("Kategori adı boş olamaz.", "error");
      return;
    }

    const trimmedName = name.trim();

    // SİPARİŞ YEMEK sadece 1 tane olsun
    if (isSiparisYemek) {
      const anotherSiparis = categories.find(
        (c) => c.isSiparisYemek && c.id !== selectedId
      );
      if (anotherSiparis) {
        showMessage(
          "Sistemde sadece bir adet 'SİPARİŞ YEMEK' tipi kategori olabilir.",
          "error"
        );
        return;
      }
    }

    const parentIdNumber = parentId ? Number(parentId) : null;

    if (selectedId) {
      // GÜNCELLE
      const updated = categories.map((c) => {
        if (c.id !== selectedId) return c;
        return {
          ...c,
          name: trimmedName,
          parentId: parentIdNumber,
          isSiparisYemek,
          hideStock,
          hideInReports,
          manualPriceEachTime,
        };
      });
      const sorted = sortByName(updated);
      setCategories(sorted);
      saveToStorage(sorted);
      showMessage("Kategori güncellendi.", "success");
    } else {
      // YENİ KATEGORİ
      const newCat = {
        id: getNextId(categories),
        name: trimmedName,
        parentId: parentIdNumber,
        isSiparisYemek,
        hideStock,
        hideInReports,
        manualPriceEachTime,
      };
      const updated = sortByName([...categories, newCat]);
      setCategories(updated);
      saveToStorage(updated);
      showMessage("Yeni kategori eklendi.", "success");
      setSelectedId(newCat.id);
    }
  };

  const handleDelete = () => {
    if (!selectedId) {
      showMessage("Silmek için önce bir kategori seçin.", "error");
      return;
    }

    if (hasChildren(selectedId)) {
      showMessage(
        "Bu kategoriye bağlı alt kategoriler var. Önce alt kategorileri taşıyın veya silin.",
        "error"
      );
      return;
    }

    const updated = categories.filter((c) => c.id !== selectedId);
    const sorted = sortByName(updated);
    setCategories(sorted);
    saveToStorage(sorted);
    showMessage("Kategori silindi.", "success");
    resetForm();
  };

  // Hiyerarşik liste
  const renderCategoryTree = () => {
    const rootCategories = categories.filter((c) => c.parentId == null);
    const sortedRoot = sortByName(rootCategories);

    const renderChildren = (parentId, level = 1) => {
      const children = categories.filter((c) => c.parentId === parentId);
      if (!children.length) return null;
      const sortedChildren = sortByName(children);
      return (
        <ul className="kategori-tree-level">
          {sortedChildren.map((child) => (
            <li key={child.id}>
              <button
                type="button"
                className={
                  "kategori-tree-item" +
                  (selectedId === child.id ? " selected" : "")
                }
                onClick={() => handleSelectCategory(child.id)}
              >
                <span className="kategori-tree-name">
                  {"— ".repeat(level)}
                  {child.name}
                </span>
                {child.isSiparisYemek && (
                  <span className="kategori-badge badge-siparis">
                    SİPARİŞ YEMEK
                  </span>
                )}
                {child.hideStock && !child.isSiparisYemek && (
                  <span className="kategori-badge badge-stock">
                    Stok Gösterme
                  </span>
                )}
                {child.hideInReports && !child.isSiparisYemek && (
                  <span className="kategori-badge badge-report">
                    Raporda Gizli
                  </span>
                )}
              </button>
              {renderChildren(child.id, level + 1)}
            </li>
          ))}
        </ul>
      );
    };

    return (
      <ul className="kategori-tree-root">
        {sortedRoot.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              className={
                "kategori-tree-item" +
                (selectedId === cat.id ? " selected" : "")
              }
              onClick={() => handleSelectCategory(cat.id)}
            >
              <span className="kategori-tree-name">{cat.name}</span>
              {cat.isSiparisYemek && (
                <span className="kategori-badge badge-siparis">
                  SİPARİŞ YEMEK
                </span>
              )}
              {cat.hideStock && !cat.isSiparisYemek && (
                <span className="kategori-badge badge-stock">
                  Stok Gösterme
                </span>
              )}
              {cat.hideInReports && !cat.isSiparisYemek && (
                <span className="kategori-badge badge-report">
                  Raporda Gizli
                </span>
              )}
            </button>
            {renderChildren(cat.id, 1)}
          </li>
        ))}
      </ul>
    );
  };

  const parentOptions = sortByName(
    categories.filter((c) => !c.isSiparisYemek) // SİPARİŞ YEMEK'i üst kategori seçtirmeyelim
  );

  return (
    <div className="page-container kategori-page">
      <div className="page-header">
        <h1 className="page-title">Kategori Yönetimi</h1>
      </div>

      {message && (
        <div className={`page-message message-${messageType}`}>
          {message}
        </div>
      )}

      <div className="kategori-layout">
        {/* SOL: Kategori Liste / Ağaç */}
        <div className="kategori-panel kategori-list-panel">
          <div className="panel-header">
            <h2>Kategori Listesi</h2>
            <p className="panel-subtitle">
              Tüm kategoriler alfabetik ve hiyerarşik olarak listelenir.
            </p>
          </div>
          <div className="kategori-tree-container">
            {categories.length === 0 ? (
              <p>Henüz kategori yok. Sağ taraftan yeni kategori ekleyebilirsiniz.</p>
            ) : (
              renderCategoryTree()
            )}
          </div>
        </div>

        {/* SAĞ: Kategori Form */}
        <div className="kategori-panel kategori-form-panel">
          <div className="panel-header">
            <h2>{selectedId ? "Kategori Düzenle" : "Yeni Kategori"}</h2>
            <p className="panel-subtitle">
              Kategori adı, üst kategori ve özel ayarları buradan yönetilir.
            </p>
          </div>

          <div className="form-row">
            <label className="form-label">Kategori Adı</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örnek: SICAK İÇECEKLER"
            />
          </div>

          <div className="form-row">
            <label className="form-label">Üst Kategori</label>
            <select
              className="form-select"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">(Ana kategori olsun)</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-box">
            <div className="form-group-title">Özel Ayarlar</div>

            <div className="form-checkbox-row">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={isSiparisYemek}
                  onChange={(e) => setIsSiparisYemek(e.target.checked)}
                />
                <span>
                  <strong>SİPARİŞ YEMEK tipi</strong>{" "}
                  (fiyat her eklemede manuel, stok ve raporlarda gizli)
                </span>
              </label>
            </div>

            <div className="form-checkbox-row">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={hideStock}
                  onChange={(e) => setHideStock(e.target.checked)}
                  disabled={isSiparisYemek}
                />
                <span>Stok bilgisi gösterilmesin (ÇAY / ORALET gibi)</span>
              </label>
            </div>

            <div className="form-checkbox-row">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={hideInReports}
                  onChange={(e) => setHideInReports(e.target.checked)}
                  disabled={isSiparisYemek}
                />
                <span>Kategori / ürün raporlarında gösterme</span>
              </label>
            </div>

            <div className="form-checkbox-row">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={manualPriceEachTime}
                  onChange={(e) => setManualPriceEachTime(e.target.checked)}
                  disabled={isSiparisYemek}
                />
                <span>
                  Fiyatı her adisyona eklemede manuel iste (SİPARİŞ YEMEK benzeri
                  davranış)
                </span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              {selectedId ? "Güncelle" : "Kaydet"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Yeni / Temizle
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KategoriYonetimi;
