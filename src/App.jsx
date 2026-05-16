import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, UserRound, X } from 'lucide-react';
import Backdrop from './components/Backdrop.jsx';
import archiveItemsData from './data/archiveItems.json';

const archiveImageModules = import.meta.glob(
  './assets/archive/**/*.{jpg,jpeg,png,webp,avif}',
  {
    eager: true,
    import: 'default',
  },
);

const productImageModules = import.meta.glob(
  './assets/products/**/*.{jpg,jpeg,png,webp,avif}',
  {
    eager: true,
    import: 'default',
  },
);

const detailIconModules = import.meta.glob(
  './assets/detail-icons/*.{svg,png,webp,avif}',
  {
    eager: true,
    import: 'default',
  },
);

const normalizeAssetKey = (value) =>
  value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();

const removeExtension = (value) => value.replace(/\.[^/.]+$/, '');

const createAssetLookup = (modules, rootDirectory) => {
  const byPath = {};
  const byFileName = {};
  const byBaseName = {};

  const rootMarker = rootDirectory ? `assets/${rootDirectory}/` : '';

  Object.entries(modules).forEach(([path, src]) => {
    const normalizedPath = normalizeAssetKey(path);
    const relativePath = rootMarker.includes('assets/')
      ? normalizedPath.split(rootMarker)[1]
      : null;
    const fileName = normalizedPath.split('/').pop() ?? '';
    const baseName = removeExtension(fileName);

    [normalizedPath, removeExtension(normalizedPath), relativePath, removeExtension(relativePath ?? '')]
      .filter(Boolean)
      .forEach((key) => {
        byPath[key] = src;
      });

    byFileName[fileName] = src;
    byBaseName[baseName] = src;
  });

  return { byBaseName, byFileName, byPath };
};

const archiveAssetLookup = createAssetLookup(archiveImageModules, 'archive');
const productAssetLookup = createAssetLookup(productImageModules, 'products');
const detailIconAssetLookup = createAssetLookup(detailIconModules, 'detail-icons');

const resolveAsset = (lookup, name) => {
  if (!name) return null;

  const normalizedName = normalizeAssetKey(name);
  const extensionlessName = removeExtension(normalizedName);
  const fileName = normalizedName.split('/').pop() ?? '';
  const baseName = removeExtension(fileName);

  return (
    lookup.byPath[normalizedName] ??
    lookup.byPath[extensionlessName] ??
    lookup.byFileName[fileName] ??
    lookup.byBaseName[baseName] ??
    null
  );
};

const viewTypes = [
  { id: 'side', iconName: 'detail-icon-03', label: 'Side view' },
  { id: 'front', iconName: 'detail-icon-01', label: 'Front view' },
  { id: 'back', iconName: 'detail-icon-02', label: 'Back view' },
];

const parseLookCode = (code) => {
  const [styleCode, seasonCode, sequence] = code.toLowerCase().split('-');

  if (!styleCode || !seasonCode || !sequence) {
    return null;
  }

  return { seasonCode, sequence, styleCode };
};

const getScopedAssetName = (code, fileName) => {
  const parsedCode = parseLookCode(code);

  if (!parsedCode) {
    return null;
  }

  return `${parsedCode.styleCode}/${parsedCode.seasonCode}/${parsedCode.sequence}/${fileName}`;
};

const getCodeGroup = (code) => code.split('-').slice(0, 2).join('-');

const styleFamilies = [
  { code: 'ST', label: 'Street' },
  { code: 'CA', label: 'Casual' },
  { code: 'MN', label: 'Minimal' },
  { code: 'CL', label: 'Classic' },
  { code: 'SP', label: 'Sport' },
  { code: 'ED', label: 'Editorial' },
];

const seasonFamilies = [
  { code: 'FW', label: 'Fall Winter' },
  { code: 'SS', label: 'Spring Summer' },
];

const codeGroupCatalog = styleFamilies.flatMap((style) =>
  seasonFamilies.map((season) => ({
    code: `${style.code}-${season.code}`,
    label: `${style.label} / ${season.label}`,
  })),
);

const resolveArchiveView = (item, code, viewId) => {
  const scopedViewName = getScopedAssetName(code, viewId);

  return (
    resolveAsset(archiveAssetLookup, item.views?.[viewId]) ??
    resolveAsset(archiveAssetLookup, scopedViewName) ??
    resolveAsset(archiveAssetLookup, `${code}-${viewId}`) ??
    (viewId === 'front'
      ? resolveAsset(archiveAssetLookup, item.image) ??
        resolveAsset(archiveAssetLookup, code) ??
        null
      : null)
  );
};

const resolveProductImage = (code, product) =>
  resolveAsset(productAssetLookup, product.productImage) ??
  resolveAsset(productAssetLookup, getScopedAssetName(code, product.id)) ??
  resolveAsset(productAssetLookup, `${code}-${product.id}`) ??
  null;

const generateArchiveItems = () =>
  archiveItemsData.map((item, index) => {
    const code = item.code;
    const shortCode =
      item.shortCode ?? code.split('-').pop() ?? String(index + 1).padStart(2, '0');
    const views = {
      front: resolveArchiveView(item, code, 'front'),
      back: resolveArchiveView(item, code, 'back'),
      side: resolveArchiveView(item, code, 'side'),
    };

    return {
      id: index,
      code,
      shortCode,
      imageSrc: views.side ?? views.front ?? views.back,
      label: item.label ?? `img${index + 1}`,
      views,
      products: (item.items ?? []).map((product) => ({
        ...product,
        productImageSrc: resolveProductImage(code, product),
      })),
    };
  });

const detailIcons = viewTypes.map((viewType) => ({
  ...viewType,
  src: resolveAsset(detailIconAssetLookup, viewType.iconName),
}));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getAvailableViewIds = (item) =>
  viewTypes.map((viewType) => viewType.id).filter((viewId) => item.views[viewId]);

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth,
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

export default function App() {
  const items = useMemo(generateArchiveItems, []);
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstImageIndex = items.findIndex((item) => item.imageSrc);
    return firstImageIndex >= 0 ? firstImageIndex : 0;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCodeGroupMode, setIsCodeGroupMode] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [activeView, setActiveView] = useState('side');
  const activeIndexRef = useRef(activeIndex);
  const carouselTouchRef = useRef(null);
  const detailTouchRef = useRef(null);
  const suppressMainCardClickRef = useRef(false);
  const suppressSlideClickRef = useRef(false);
  const wheelAccumulator = useRef(0);
  const wheelLock = useRef(false);
  const viewportWidth = useViewportWidth();

  const isMobileViewport = viewportWidth <= 720;
  const radius = clamp(viewportWidth * 0.42, 460, 820);
  const angleStep = viewportWidth < 720 ? 16 : 13;
  const maxVisibleDistance = viewportWidth < 720 ? 3 : 6;
  const orbitOffset = viewportWidth < 720 ? 168 : 232;
  const currentRotation = -activeIndex * angleStep;
  const activeItem = items[activeIndex];
  const activeCodeGroup = getCodeGroup(activeItem.code);
  const availableCodeGroups = useMemo(
    () => new Set(items.map((item) => getCodeGroup(item.code))),
    [items],
  );
  const codeGroupOptions = useMemo(
    () =>
      codeGroupCatalog.map((group) => ({
        ...group,
        isActive: group.code === activeCodeGroup,
        isAvailable: availableCodeGroups.has(group.code),
      })),
    [activeCodeGroup, availableCodeGroups],
  );
  const fallbackView = activeItem.views.side
    ? 'side'
    : getAvailableViewIds(activeItem)[0] ?? 'side';
  const resolvedActiveView = activeItem.views[activeView] ? activeView : fallbackView;
  const activeImageSrc = activeItem.views[resolvedActiveView] ?? activeItem.imageSrc;
  const activeViewImages = viewTypes
    .map((viewType) => ({
      id: viewType.id,
      label: viewType.label,
      src: activeItem.views[viewType.id],
    }))
    .filter((view) => view.src);
  const useMobileIndexCrossfade = isMobileViewport && !isDetailOpen;
  const mobileMainImages = useMemo(
    () =>
      items
        .map((item, index) => {
          const viewId = item.views.side
            ? 'side'
            : getAvailableViewIds(item)[0] ?? 'side';

          return {
            id: item.id,
            isActive: index === activeIndex,
            src: item.views[viewId] ?? item.imageSrc,
          };
        })
        .filter((item) => item.src),
    [activeIndex, items],
  );
  const isProductInfoVisible = isDetailOpen && (!isMobileViewport || isMobileInfoOpen);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    setActiveView('side');
  }, [activeIndex]);

  useEffect(() => {
    setExpandedProductId(null);
    setIsCodeGroupMode(false);
    setIsMobileInfoOpen(false);
  }, [activeIndex, isDetailOpen]);

  useEffect(() => {
    if (!isModalOpen) {
      setIsCodeGroupMode(false);
      return;
    }

    setIsMobileInfoOpen(false);
  }, [isModalOpen]);

  const moveToIndex = useCallback(
    (nextIndex) => {
      setActiveIndex(clamp(nextIndex, 0, items.length - 1));
    },
    [items.length],
  );

  const moveToCodeGroup = useCallback(
    (groupCode) => {
      const firstGroupIndex = items.findIndex((item) => getCodeGroup(item.code) === groupCode);

      if (firstGroupIndex < 0) {
        return;
      }

      moveToIndex(firstGroupIndex);
      setIsCodeGroupMode(false);
    },
    [items, moveToIndex],
  );

  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();

      if (isModalOpen) {
        return;
      }

      if (Math.abs(event.deltaY) < 2 || wheelLock.current) {
        return;
      }

      wheelAccumulator.current += event.deltaY;

      if (Math.abs(wheelAccumulator.current) < 28) {
        return;
      }

      const direction = Math.sign(wheelAccumulator.current);

      if (isDetailOpen) {
        const availableViewIds = getAvailableViewIds(activeItem);

        if (availableViewIds.length > 1) {
          setActiveView((currentView) => {
            const currentViewIndex = Math.max(0, availableViewIds.indexOf(currentView));
            const nextViewIndex = clamp(
              currentViewIndex + direction,
              0,
              availableViewIds.length - 1,
            );

            return availableViewIds[nextViewIndex] ?? currentView;
          });
        }

        wheelAccumulator.current = 0;
        wheelLock.current = true;

        window.setTimeout(() => {
          wheelLock.current = false;
        }, 180);

        return;
      }

      const nextIndex = clamp(activeIndexRef.current + direction, 0, items.length - 1);

      if (nextIndex !== activeIndexRef.current) {
        moveToIndex(nextIndex);
      }

      wheelAccumulator.current = 0;
      wheelLock.current = true;

      window.setTimeout(() => {
        wheelLock.current = false;
      }, 130);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeItem, isDetailOpen, isModalOpen, items.length, moveToIndex]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isModalOpen) {
        if (event.key === 'Escape') {
          setIsModalOpen(false);
        }

        return;
      }

      if (event.key === 'Escape' && isDetailOpen) {
        setActiveView('side');
        setIsDetailOpen(false);
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        moveToIndex(activeIndexRef.current + 1);
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        moveToIndex(activeIndexRef.current - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen, isModalOpen, moveToIndex]);

  const handleMainCardKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    setIsDetailOpen((isOpen) => {
      if (isOpen) {
        setActiveView('side');
      }

      return !isOpen;
    });
  }, []);

  const closeDetailView = useCallback(() => {
    setActiveView('side');
    setIsMobileInfoOpen(false);
    setIsDetailOpen(false);
  }, []);

  const handleDetailTouchStart = useCallback(
    (event) => {
      if (!isMobileViewport || !isDetailOpen || isModalOpen || event.touches.length !== 1) {
        detailTouchRef.current = null;
        return;
      }

      const touch = event.touches[0];

      detailTouchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
      };
    },
    [isDetailOpen, isMobileViewport, isModalOpen],
  );

  const handleDetailTouchEnd = useCallback(
    (event) => {
      const touchStart = detailTouchRef.current;
      detailTouchRef.current = null;

      if (!touchStart || !isMobileViewport || !isDetailOpen || isModalOpen) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.startX;
      const deltaY = touch.clientY - touchStart.startY;
      const isVerticalSwipe = Math.abs(deltaY) > 48 && Math.abs(deltaY) > Math.abs(deltaX) * 1.25;

      if (!isVerticalSwipe) {
        return;
      }

      event.preventDefault();
      suppressMainCardClickRef.current = true;
      window.setTimeout(() => {
        suppressMainCardClickRef.current = false;
      }, 320);

      setIsMobileInfoOpen(deltaY < 0);
    },
    [isDetailOpen, isMobileViewport, isModalOpen],
  );

  const handleDetailTouchCancel = useCallback(() => {
    detailTouchRef.current = null;
  }, []);

  const handleCarouselTouchStart = useCallback(
    (event) => {
      if (!isMobileViewport || isModalOpen || isDetailOpen || event.touches.length !== 1) {
        carouselTouchRef.current = null;
        return;
      }

      const touch = event.touches[0];

      carouselTouchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
      };
    },
    [isDetailOpen, isMobileViewport, isModalOpen],
  );

  const handleCarouselTouchEnd = useCallback(
    (event) => {
      const touchStart = carouselTouchRef.current;
      carouselTouchRef.current = null;

      if (!touchStart || !isMobileViewport || isModalOpen || isDetailOpen) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.startX;
      const deltaY = touch.clientY - touchStart.startY;
      const isHorizontalSwipe = Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

      if (!isHorizontalSwipe) {
        return;
      }

      suppressSlideClickRef.current = true;
      window.setTimeout(() => {
        suppressSlideClickRef.current = false;
      }, 320);

      moveToIndex(activeIndexRef.current + (deltaX < 0 ? 1 : -1));
    },
    [isDetailOpen, isMobileViewport, isModalOpen, moveToIndex],
  );

  const handleCarouselTouchCancel = useCallback(() => {
    carouselTouchRef.current = null;
  }, []);

  return (
    <main
      className={`archive-page ${isDetailOpen ? 'is-detail-open' : ''} ${
        isMobileInfoOpen ? 'is-mobile-info-open' : ''
      }`}
      aria-label="Fashion archive carousel"
      onTouchStart={handleDetailTouchStart}
      onTouchEnd={handleDetailTouchEnd}
      onTouchCancel={handleDetailTouchCancel}
    >
      <header className="archive-header">
        <label className="search-shell" aria-label="Search archive">
          <input className="search-input" type="search" placeholder="Search archive" />
          <Search className="search-icon" aria-hidden="true" strokeWidth={1.4} />
        </label>

        <button className="profile-button" type="button" aria-label="Open profile">
          <UserRound aria-hidden="true" strokeWidth={1.4} />
        </button>
      </header>

      <section className="main-display" aria-live="polite">
        <button
          className="detail-close-button"
          type="button"
          aria-label="Close image detail"
          onClick={closeDetailView}
        >
          <X aria-hidden="true" strokeWidth={1.6} />
        </button>

        <nav className="detail-icon-rail" aria-label="Detail actions">
          {detailIcons.map((icon) => (
            <button
              className={`detail-icon-button ${
                resolvedActiveView === icon.id && activeItem.views[icon.id] ? 'is-active' : ''
              }`}
              type="button"
              key={icon.id}
              aria-label={icon.label}
              aria-pressed={resolvedActiveView === icon.id && Boolean(activeItem.views[icon.id])}
              disabled={!activeItem.views[icon.id]}
              onClick={() => setActiveView(icon.id)}
            >
              {icon.src ? (
                <img
                  className="detail-icon-image"
                  src={icon.src}
                  alt=""
                  draggable="false"
                />
              ) : (
                <span className="detail-icon-placeholder" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>

        <div
          className={`main-card ${activeImageSrc ? 'has-image' : ''} ${
            useMobileIndexCrossfade ? 'is-mobile-crossfade' : ''
          }`}
          key={isMobileViewport ? 'mobile-main-card' : activeItem.id}
          role="button"
          tabIndex={0}
          aria-label={isDetailOpen ? 'Close image detail' : 'Open image detail'}
          aria-pressed={isDetailOpen}
          onClick={() => {
            if (suppressMainCardClickRef.current) {
              suppressMainCardClickRef.current = false;
              return;
            }

            if (isDetailOpen) {
              closeDetailView();
              return;
            }

            setIsDetailOpen(true);
          }}
          onKeyDown={handleMainCardKeyDown}
        >
          {useMobileIndexCrossfade
            ? mobileMainImages.map((item) => (
                <img
                  className={`archive-image archive-view-image mobile-main-image ${
                    item.isActive ? 'is-active' : ''
                  }`}
                  key={item.id}
                  src={item.src}
                  alt=""
                  draggable="false"
                  aria-hidden={!item.isActive}
                />
              ))
            : activeViewImages.map((view) => (
                <img
                  className={`archive-image archive-view-image ${
                    resolvedActiveView === view.id ? 'is-active' : ''
                  }`}
                  key={
                    isMobileViewport
                      ? view.id === fallbackView
                        ? activeItem.id
                        : `${activeItem.id}-${view.id}`
                      : view.id
                  }
                  src={view.src}
                  alt=""
                  draggable="false"
                  aria-hidden={resolvedActiveView !== view.id}
                />
              ))}
          <span className="image-label">{activeItem.label}</span>
        </div>
      </section>

      <aside
        className="product-info-panel"
        aria-live="polite"
        aria-hidden={!isProductInfoVisible}
      >
        <header className="product-panel-header">
          <p className="product-panel-code">{activeItem.code}</p>
        </header>

        {activeItem.products.length > 0 ? (
          <ul className="product-list" aria-label={`${activeItem.code} item list`}>
            {activeItem.products.map((product, productIndex) => {
              const isExpanded = expandedProductId === product.id;

              return (
                <li
                  className={`product-list-item ${isExpanded ? 'is-expanded' : ''}`}
                  key={product.id}
                >
                  <button
                    className="product-accordion-trigger"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`product-detail-${product.id}`}
                    onClick={() =>
                      setExpandedProductId((currentId) =>
                        currentId === product.id ? null : product.id,
                      )
                    }
                  >
                    <span className="product-index">
                      {String(productIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="product-copy">
                      {product.category && (
                        <span className="product-category">{product.category}</span>
                      )}
                      <span className="product-name">{product.name}</span>
                    </span>
                    <ChevronDown className="product-toggle-icon" aria-hidden="true" />
                  </button>

                  <div
                    className="product-accordion-panel"
                    id={`product-detail-${product.id}`}
                  >
                    <div className="product-detail-inner">
                      <div className="product-thumb-frame">
                        {product.productImageSrc ? (
                          <img
                            className="product-image"
                            src={product.productImageSrc}
                            alt=""
                            draggable="false"
                          />
                        ) : (
                          <span className="product-image-placeholder">NO IMAGE</span>
                        )}
                      </div>

                      {product.description && (
                        <p className="product-description">{product.description}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="product-empty-state">
            <span>NO ITEM INFO</span>
          </div>
        )}
      </aside>

      <section
        className="carousel-shell"
        aria-label="Archive image carousel"
        onTouchStart={handleCarouselTouchStart}
        onTouchEnd={handleCarouselTouchEnd}
        onTouchCancel={handleCarouselTouchCancel}
      >
        <div
          className="carousel-orbit"
          style={{
            '--radius': `${radius}px`,
            '--orbit-bottom': `-${radius - orbitOffset}px`,
            '--rotation': `${currentRotation}deg`,
          }}
        >
          {items.map((item, index) => {
            const distance = index - activeIndex;
            const absDistance = Math.abs(distance);
            const isActive = index === activeIndex;
            const isVisible = absDistance <= maxVisibleDistance;

            return (
              <button
                className={`slide-card ${isActive ? 'is-active' : ''} ${
                  item.imageSrc ? 'has-image' : ''
                }`}
                key={item.id}
                type="button"
                aria-label={`${item.code} view`}
                aria-current={isActive}
                onClick={() => {
                  if (suppressSlideClickRef.current) {
                    suppressSlideClickRef.current = false;
                    return;
                  }

                  if (isDetailOpen) {
                    closeDetailView();
                    return;
                  }

                  moveToIndex(index);
                }}
                style={{
                  '--item-angle': `${index * angleStep}deg`,
                  '--relative-angle': `${distance * angleStep}deg`,
                  '--depth': 100 - absDistance,
                  opacity: isVisible ? 1 : 0,
                  visibility: isVisible ? 'visible' : 'hidden',
                  pointerEvents: isVisible ? 'auto' : 'none',
                }}
              >
                {item.imageSrc && (
                  <img
                    className="archive-image"
                    src={item.imageSrc}
                    alt=""
                    draggable="false"
                  />
                )}
                <span className="image-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="archive-meta" aria-label="Active archive item">
        <button
          className={`code-pill ${isModalOpen ? 'is-hidden' : ''}`}
          type="button"
          aria-label="Open code list"
          onClick={() => setIsModalOpen(true)}
        >
          <div
            className="code-track"
            style={{ transform: `translateY(-${activeIndex * 42}px)` }}
          >
            {items.map((item) => (
              <span className="code-value" key={item.id}>
                {item.code}
              </span>
            ))}
          </div>
        </button>
      </footer>

      <section
        className={`code-modal-layer ${isModalOpen ? 'is-open' : ''}`}
        aria-hidden={!isModalOpen}
      >
        <Backdrop
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ariaLabel="Close code list"
        />

        <div className="code-modal" role="dialog" aria-modal="true" aria-label="Archive code list">
          <header className="code-modal-header">
            <button
              className={`season-button ${isCodeGroupMode ? 'is-open' : ''}`}
              type="button"
              aria-label="Toggle archive code groups"
              aria-expanded={isCodeGroupMode}
              aria-controls="code-modal-grid"
              onClick={() => setIsCodeGroupMode((isOpen) => !isOpen)}
            >
              <span>{activeCodeGroup}</span>
              <ChevronDown aria-hidden="true" strokeWidth={2} />
            </button>

            <button
              className="modal-close-button"
              type="button"
              aria-label="Close code list"
              onClick={() => setIsModalOpen(false)}
            >
              <X aria-hidden="true" strokeWidth={1.8} />
            </button>
          </header>

          <div
            className={`code-grid ${isCodeGroupMode ? 'is-group-mode' : ''}`}
            id="code-modal-grid"
            aria-label={isCodeGroupMode ? 'Archive code groups' : 'Archive codes'}
          >
            {isCodeGroupMode
              ? codeGroupOptions.map((group) => (
                  <button
                    className={`modal-group-button ${group.isActive ? 'is-active' : ''}`}
                    type="button"
                    key={group.code}
                    disabled={!group.isAvailable}
                    aria-current={group.isActive}
                    onClick={() => moveToCodeGroup(group.code)}
                  >
                    <span className="code-active-mark" aria-hidden="true" />
                    <span className="modal-group-copy">
                      <span className="modal-group-code">{group.code}</span>
                      <span className="modal-group-label">{group.label}</span>
                    </span>
                  </button>
                ))
              : items.map((item, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <button
                      className={`modal-code-button ${isActive ? 'is-active' : ''}`}
                      key={item.id}
                      type="button"
                      aria-current={isActive}
                      onClick={() => {
                        moveToIndex(index);
                        setIsModalOpen(false);
                      }}
                    >
                      <span className="code-active-mark" aria-hidden="true" />
                      <span>{item.shortCode}</span>
                    </button>
                  );
                })}
          </div>
        </div>
      </section>
    </main>
  );
}
