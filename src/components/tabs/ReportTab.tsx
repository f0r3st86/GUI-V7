// ReportTab - Interactive Investor Report
// RPubs-style document with embedded maps, photo galleries, comparable sales,
// and interactive charts. Designed to be shared with investors.
//
// Features:
//   - Leaflet map with property pins and comp pins
//   - Photo gallery with lightbox viewer
//   - Comparable sales table with inline photos
//   - Recharts bar/line charts for valuation and payment trends
//   - Collapsible sections
//   - Print-friendly styling

import React, { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { useTheme } from '../../context';
import { useLoan } from '../../context';
import { useLoans, useBorrowers, useCollateral, usePayments } from '../../hooks';
import {
  initialPropertyPhotos,
  initialPropertyLocations,
  initialComparableSales
} from '../../data';
import type { PropertyPhoto, ThemeStyles } from '../../types';

// Fix Leaflet default marker icon issue with bundlers
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const compIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
  className: 'comp-marker-icon'
});

L.Marker.prototype.options.icon = defaultIcon;

// Status colors for charts
const STATUS_COLORS: Record<string, string> = {
  'PA': '#22c55e',
  'FA': '#3b82f6',
  'FC': '#ef4444',
  'JG': '#eab308',
  'LT': '#f97316',
  '': '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  'PA': 'Performing',
  'FA': 'Forbearance',
  'FC': 'Foreclosure',
  'JG': 'Judgment',
  'LT': 'Litigation',
  '': 'Active',
};

// Photo type colors for placeholder thumbnails
const PHOTO_TYPE_COLORS: Record<string, string> = {
  exterior: '#3b82f6',
  interior: '#8b5cf6',
  aerial: '#06b6d4',
  street: '#10b981',
  comp: '#f59e0b',
  other: '#6b7280',
};

const parseNum = (val: string): number => parseFloat(val.replace(/[$,]/g, '')) || 0;
const fmtCurrency = (val: number): string => `$${val.toLocaleString()}`;
const fmtNum = (val: number): string => val.toLocaleString();

// ==================== SUB-COMPONENTS ====================

// Collapsible section wrapper
const Section: React.FC<{
  title: string;
  defaultOpen?: boolean;
  styles: ThemeStyles;
  children: React.ReactNode;
}> = ({ title, defaultOpen = true, styles, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${styles.cardBg} rounded-lg ${styles.inputBorder} border mb-4 print:break-inside-avoid`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${styles.textPrimary} hover:opacity-80 print:pointer-events-none`}
        aria-expanded={open}
      >
        <h2 className="text-base font-semibold">{title}</h2>
        <span className={`text-lg transition-transform ${open ? 'rotate-180' : ''} print:hidden`}>
          &#9660;
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

// Photo thumbnail placeholder (renders colored block when no real image URL)
const PhotoThumbnail: React.FC<{
  photo: PropertyPhoto;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ photo, onClick, size = 'md' }) => {
  const dims = size === 'sm' ? 'w-20 h-16' : size === 'lg' ? 'w-48 h-36' : 'w-32 h-24';
  const bgColor = PHOTO_TYPE_COLORS[photo.type] || '#6b7280';

  return (
    <button
      onClick={onClick}
      className={`${dims} rounded overflow-hidden flex-shrink-0 relative group cursor-pointer border border-white/20`}
      title={photo.caption}
    >
      {photo.url ? (
        <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center text-white text-xs p-1"
          style={{ backgroundColor: bgColor }}
        >
          <span className="font-medium capitalize">{photo.type}</span>
          <span className="opacity-70 text-center leading-tight mt-0.5" style={{ fontSize: '9px' }}>
            {photo.caption.length > 30 ? photo.caption.slice(0, 30) + '...' : photo.caption}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
    </button>
  );
};

// Lightbox photo viewer modal
const PhotoLightbox: React.FC<{
  photos: PropertyPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}> = ({ photos, currentIndex, onClose, onNavigate }) => {
  const photo = photos[currentIndex];
  if (!photo) return null;

  const bgColor = PHOTO_TYPE_COLORS[photo.type] || '#6b7280';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 print:hidden"
      onClick={onClose}
      role="dialog"
      aria-label="Photo viewer"
    >
      <div
        className="relative max-w-4xl w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl hover:opacity-70 z-10"
          aria-label="Close photo viewer"
        >
          &#10005;
        </button>

        {/* Photo display */}
        <div className="rounded-lg overflow-hidden">
          {photo.url ? (
            <img src={photo.url} alt={photo.caption} className="w-full max-h-[70vh] object-contain" />
          ) : (
            <div
              className="w-full flex flex-col items-center justify-center text-white p-8"
              style={{ backgroundColor: bgColor, minHeight: '400px' }}
            >
              <span className="text-6xl mb-4">&#128247;</span>
              <span className="text-xl font-medium capitalize mb-2">{photo.type} Photo</span>
              <span className="text-sm opacity-80">{photo.caption}</span>
              <span className="text-xs opacity-50 mt-4">
                Photo placeholder - add image URL to display actual photo
              </span>
            </div>
          )}
        </div>

        {/* Caption & navigation */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1)}
            className="text-white text-xl px-3 py-1 hover:bg-white/10 rounded"
            aria-label="Previous photo"
          >
            &#9664; Prev
          </button>
          <div className="text-center text-white">
            <p className="text-sm">{photo.caption}</p>
            <p className="text-xs opacity-60">{currentIndex + 1} of {photos.length}</p>
          </div>
          <button
            onClick={() => onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0)}
            className="text-white text-xl px-3 py-1 hover:bg-white/10 rounded"
            aria-label="Next photo"
          >
            Next &#9654;
          </button>
        </div>
      </div>
    </div>
  );
};

// Photo gallery strip for a set of photos
const PhotoGallery: React.FC<{
  photos: PropertyPhoto[];
  title?: string;
  styles: ThemeStyles;
}> = ({ photos, title, styles }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const photoTypes = useMemo(() => {
    const types = new Set(photos.map(p => p.type));
    return ['all', ...Array.from(types)];
  }, [photos]);

  const filtered = filterType === 'all' ? photos : photos.filter(p => p.type === filterType);

  if (photos.length === 0) return null;

  return (
    <div>
      {title && <h4 className={`text-sm font-medium mb-2 ${styles.textPrimary}`}>{title}</h4>}

      {/* Filter buttons */}
      <div className="flex gap-1 mb-2 print:hidden">
        {photoTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2 py-0.5 rounded text-xs capitalize ${
              filterType === type
                ? 'bg-blue-600 text-white'
                : `${styles.inputBg} ${styles.textMuted} ${styles.inputBorder} border`
            }`}
          >
            {type} {type !== 'all' ? `(${photos.filter(p => p.type === type).length})` : `(${photos.length})`}
          </button>
        ))}
      </div>

      {/* Photo strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filtered.map((photo) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            onClick={() => setLightboxIndex(photos.indexOf(photo))}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
};

// ==================== MAIN REPORT COMPONENT ====================

export const ReportTab = React.memo(() => {
  const { styles } = useTheme();
  const { currentRelationship } = useLoan();

  // Data from React Query
  const { data: loans = [], isLoading: loansLoading } = useLoans();
  const { data: borrowers = [], isLoading: borrowersLoading } = useBorrowers();
  const { data: allCollateral = [], isLoading: collateralLoading } = useCollateral();
  const { data: payments = [] } = usePayments();

  const isLoading = loansLoading || borrowersLoading || collateralLoading;

  // State for comp gallery
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);

  // Derived data
  const relationshipLoans = useMemo(() =>
    loans.filter(l => l.relatedLoans === currentRelationship),
    [loans, currentRelationship]
  );

  const relationshipBorrowers = useMemo(() =>
    borrowers.filter(b => b.relationship === currentRelationship),
    [borrowers, currentRelationship]
  );

  const relationshipCollateral = useMemo(
    () => allCollateral.filter(c => c.relatedLoans === currentRelationship),
    [allCollateral, currentRelationship]
  );

  // Aggregates
  const totalUPB = useMemo(() =>
    relationshipLoans.reduce((s, l) => s + (l.principal || 0) + (l.interest || 0) + (l.escrowBalance || 0) + (l.otherBalance || 0), 0),
    [relationshipLoans]
  );

  const totalCollateralValue = useMemo(() =>
    relationshipCollateral.reduce((s, c) => s + parseNum(c.appraisedValue), 0),
    [relationshipCollateral]
  );

  // Status breakdown for pie chart
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    relationshipLoans.forEach(l => {
      const s = l.status || '';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status || 'Active',
      value: count,
      color: STATUS_COLORS[status] || '#6b7280',
    }));
  }, [relationshipLoans]);

  // UPB by loan for bar chart
  const loanUPBData = useMemo(() =>
    relationshipLoans.map(l => ({
      name: l.mwLoanNo,
      upb: (l.principal || 0) + (l.interest || 0) + (l.escrowBalance || 0) + (l.otherBalance || 0),
      collateral: relationshipCollateral
        .filter(c => c.loanNo === l.mwLoanNo)
        .reduce((s, c) => s + parseNum(c.appraisedValue), 0),
      status: l.status || '',
    })),
    [relationshipLoans, relationshipCollateral]
  );

  // Valuation comparison for collateral
  const valuationData = useMemo(() =>
    relationshipCollateral.map(c => ({
      name: c.description.length > 20 ? c.description.slice(0, 20) + '...' : c.description,
      appraised: parseNum(c.appraisedValue),
      bpo: parseNum(c.bpoValue),
      ourValue: parseNum(c.ourValue),
      taxMarket: parseNum(c.taxMarketValue),
    })),
    [relationshipCollateral]
  );

  // Payment trend data (monthly totals across all loans)
  const paymentTrend = useMemo(() => {
    const loanNos = new Set(relationshipLoans.map(l => l.mwLoanNo));
    const monthly: Record<string, number> = {};
    payments
      .filter(p => loanNos.has(p.loanNo))
      .forEach(p => {
        const key = `${p.year}-${p.month.padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + parseFloat(p.amount || '0');
      });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, amount]) => ({ period, amount }));
  }, [payments, relationshipLoans]);

  // Map center (average of all property locations)
  const mapCenter = useMemo((): [number, number] => {
    const locs = initialPropertyLocations.filter(loc =>
      relationshipCollateral.some(c => c.mwPropertyNo === loc.mwPropertyNo)
    );
    if (locs.length === 0) return [43.66, -70.25]; // Portland, ME default
    const avgLat = locs.reduce((s, l) => s + l.lat, 0) / locs.length;
    const avgLng = locs.reduce((s, l) => s + l.lng, 0) / locs.length;
    return [avgLat, avgLng];
  }, [relationshipCollateral]);

  // Photos for current relationship's collateral
  const collateralPhotos = useMemo(() => {
    const ids = new Set(relationshipCollateral.map(c => c.mwPropertyNo));
    return initialPropertyPhotos.filter(p => ids.has(p.mwPropertyNo));
  }, [relationshipCollateral]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading report data...</p>
      </div>
    );
  }

  const ltv = totalCollateralValue > 0 ? ((totalUPB / totalCollateralValue) * 100).toFixed(1) : 'N/A';

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* ===== REPORT HEADER ===== */}
      <div className={`${styles.cardBg} rounded-lg p-6 ${styles.inputBorder} border mb-4 print:border-black`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${styles.textPrimary}`}>
              Investor Report: {currentRelationship}
            </h1>
            <p className={`text-sm ${styles.textMuted} mt-1`}>
              Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 print:hidden"
          >
            Print / Export PDF
          </button>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
          {[
            { label: 'Total UPB', value: fmtCurrency(totalUPB) },
            { label: 'Collateral Value', value: fmtCurrency(totalCollateralValue) },
            { label: 'LTV', value: `${ltv}%` },
            { label: 'Loans', value: String(relationshipLoans.length) },
            { label: 'Borrowers', value: String(relationshipBorrowers.length) },
          ].map(metric => (
            <div key={metric.label} className={`text-center p-3 rounded ${styles.inputBg}`}>
              <p className={`text-xs ${styles.textMuted} uppercase tracking-wide`}>{metric.label}</p>
              <p className={`text-lg font-bold ${styles.textPrimary} mt-1`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== PROPERTY MAP ===== */}
      <Section title="Property Map" styles={styles}>
        <div className="rounded-lg overflow-hidden border border-gray-600" style={{ height: '400px' }}>
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Subject property markers */}
            {initialPropertyLocations
              .filter(loc => relationshipCollateral.some(c => c.mwPropertyNo === loc.mwPropertyNo))
              .map(loc => {
                const coll = relationshipCollateral.find(c => c.mwPropertyNo === loc.mwPropertyNo);
                return (
                  <Marker key={`prop-${loc.mwPropertyNo}`} position={[loc.lat, loc.lng]} icon={defaultIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold text-blue-700">Subject Property</p>
                        <p className="font-medium">{coll?.description}</p>
                        <p>{loc.address}</p>
                        {coll && <p className="mt-1">Appraised: ${coll.appraisedValue}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            {/* Comparable sale markers */}
            {initialComparableSales.map(comp => (
              <Marker key={`comp-${comp.id}`} position={[comp.lat, comp.lng]} icon={compIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-amber-700">Comp #{comp.id}</p>
                    <p className="font-medium">{comp.address}</p>
                    <p>{comp.city}, {comp.state} {comp.zip}</p>
                    <p className="mt-1">Sale: {fmtCurrency(comp.salePrice)} ({comp.saleDate})</p>
                    <p>{fmtNum(comp.sqft)} sqft | ${comp.pricePerSqft.toFixed(0)}/sqft</p>
                    <p>{comp.distanceMiles} mi from subject</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className={styles.textMuted}>
            <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-1 align-middle" /> Subject Properties ({relationshipCollateral.length})
          </span>
          <span className={styles.textMuted}>
            <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-1 align-middle" /> Comparable Sales ({initialComparableSales.length})
          </span>
        </div>
      </Section>

      {/* ===== PROPERTY PHOTOS ===== */}
      <Section title="Property Photos" styles={styles}>
        {relationshipCollateral.map(c => {
          const photos = collateralPhotos.filter(p => p.mwPropertyNo === c.mwPropertyNo);
          return (
            <div key={c.mwPropertyNo} className="mb-4 last:mb-0">
              <PhotoGallery
                photos={photos}
                title={`${c.description} - ${c.address1}, ${c.city}`}
                styles={styles}
              />
            </div>
          );
        })}
        {collateralPhotos.length === 0 && (
          <p className={`text-sm ${styles.textMuted}`}>No photos available. Add property photos to display here.</p>
        )}
      </Section>

      {/* ===== COMPARABLE SALES ===== */}
      <Section title="Comparable Sales Analysis" styles={styles}>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs" role="table" aria-label="Comparable sales">
            <thead>
              <tr className={`${styles.tableHeaderBg} border-b ${styles.inputBorder}`}>
                <th className={`text-left px-2 py-1.5 font-medium ${styles.textSecondary}`}>#</th>
                <th className={`text-left px-2 py-1.5 font-medium ${styles.textSecondary}`}>Address</th>
                <th className={`text-right px-2 py-1.5 font-medium ${styles.textSecondary}`}>Sale Price</th>
                <th className={`text-center px-2 py-1.5 font-medium ${styles.textSecondary}`}>Date</th>
                <th className={`text-right px-2 py-1.5 font-medium ${styles.textSecondary}`}>SqFt</th>
                <th className={`text-right px-2 py-1.5 font-medium ${styles.textSecondary}`}>$/SqFt</th>
                <th className={`text-right px-2 py-1.5 font-medium ${styles.textSecondary}`}>Distance</th>
                <th className={`text-center px-2 py-1.5 font-medium ${styles.textSecondary}`}>Type</th>
                <th className={`text-center px-2 py-1.5 font-medium ${styles.textSecondary} print:hidden`}>Photos</th>
              </tr>
            </thead>
            <tbody>
              {initialComparableSales.map(comp => (
                <tr
                  key={comp.id}
                  className={`border-b ${styles.inputBorder} ${selectedCompId === comp.id ? styles.selectedBg : ''} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedCompId(selectedCompId === comp.id ? null : comp.id)}
                >
                  <td className={`px-2 py-1.5 font-medium ${styles.textPrimary}`}>{comp.id}</td>
                  <td className={`px-2 py-1.5 ${styles.textPrimary}`}>{comp.address}, {comp.city}</td>
                  <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{fmtCurrency(comp.salePrice)}</td>
                  <td className={`px-2 py-1.5 text-center ${styles.textPrimary}`}>{comp.saleDate}</td>
                  <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{fmtNum(comp.sqft)}</td>
                  <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>${comp.pricePerSqft.toFixed(0)}</td>
                  <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{comp.distanceMiles} mi</td>
                  <td className={`px-2 py-1.5 text-center ${styles.textPrimary}`}>{comp.propertyType}</td>
                  <td className={`px-2 py-1.5 text-center ${styles.textMuted} print:hidden`}>{comp.photos.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expanded comp photos */}
        {selectedCompId !== null && (() => {
          const comp = initialComparableSales.find(c => c.id === selectedCompId);
          if (!comp) return null;
          return (
            <div className={`p-3 rounded ${styles.inputBg} ${styles.inputBorder} border`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${styles.textPrimary}`}>
                  Comp #{comp.id}: {comp.address} - Photos
                </h4>
                <button
                  onClick={() => setSelectedCompId(null)}
                  className={`text-xs ${styles.textMuted} hover:opacity-70 print:hidden`}
                >
                  Close
                </button>
              </div>
              <PhotoGallery photos={comp.photos} styles={styles} />
            </div>
          );
        })()}
      </Section>

      {/* ===== PORTFOLIO OVERVIEW CHARTS ===== */}
      <Section title="Portfolio Analysis" styles={styles}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Pie Chart */}
          <div>
            <h4 className={`text-sm font-medium mb-2 ${styles.textPrimary}`}>Loan Status Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* UPB vs Collateral Bar Chart */}
          <div>
            <h4 className={`text-sm font-medium mb-2 ${styles.textPrimary}`}>UPB vs Collateral Value by Loan</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={loanUPBData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} />
                <YAxis tick={{ fill: '#999', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmtCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="upb" name="UPB" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collateral" name="Collateral" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* ===== COLLATERAL VALUATION ===== */}
      <Section title="Collateral Valuation Comparison" styles={styles}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={valuationData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} />
            <YAxis tick={{ fill: '#999', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmtCurrency(Number(v))} />
            <Legend />
            <Bar dataKey="appraised" name="Appraised" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bpo" name="BPO" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ourValue" name="Our Value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="taxMarket" name="Tax Market" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== PAYMENT HISTORY ===== */}
      {paymentTrend.length > 0 && (
        <Section title="Payment History Trend" styles={styles}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={paymentTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="period" tick={{ fill: '#999', fontSize: 10 }} />
              <YAxis tick={{ fill: '#999', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtCurrency(Number(v))} />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Payment" />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ===== LOAN DETAIL TABLE ===== */}
      <Section title="Loan Portfolio Detail" styles={styles}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="table" aria-label="Loan portfolio">
            <thead>
              <tr className={`${styles.tableHeaderBg} border-b ${styles.inputBorder}`}>
                {['Loan #', 'Borrower', 'Asset Type', 'Orig Bal', 'Principal', 'Interest', 'Total UPB', 'Rate', 'Payment', 'Status'].map(h => (
                  <th key={h} className={`px-2 py-1.5 font-medium ${styles.textSecondary} ${
                    ['Orig Bal', 'Principal', 'Interest', 'Total UPB', 'Rate', 'Payment'].includes(h) ? 'text-right' : 'text-left'
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relationshipLoans.map(loan => {
                const upb = (loan.principal || 0) + (loan.interest || 0) + (loan.escrowBalance || 0) + (loan.otherBalance || 0);
                return (
                  <tr key={loan.mwLoanNo} className={`border-b ${styles.inputBorder}`}>
                    <td className={`px-2 py-1.5 font-medium ${styles.textPrimary}`}>{loan.mwLoanNo}</td>
                    <td className={`px-2 py-1.5 ${styles.textPrimary}`}>{loan.borrowerName}</td>
                    <td className={`px-2 py-1.5 ${styles.textPrimary}`}>{loan.assetType}</td>
                    <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{fmtCurrency(loan.origBalance)}</td>
                    <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{fmtCurrency(loan.principal)}</td>
                    <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{fmtCurrency(loan.interest)}</td>
                    <td className={`px-2 py-1.5 text-right font-medium ${styles.textPrimary}`}>{fmtCurrency(upb)}</td>
                    <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{loan.intRate.toFixed(2)}%</td>
                    <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>{fmtCurrency(loan.pmt)}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{
                        backgroundColor: STATUS_COLORS[loan.status] || '#6b7280',
                        color: 'white'
                      }}>
                        {STATUS_LABELS[loan.status] || loan.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ===== FOOTER ===== */}
      <div className={`text-center py-4 text-xs ${styles.textMuted} print:mt-8`}>
        <p>Confidential - For Authorized Investor Use Only</p>
        <p className="mt-1">
          {currentRelationship} Relationship Report | Generated {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
});
ReportTab.displayName = 'ReportTab';
