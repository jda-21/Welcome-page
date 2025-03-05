import React, { useState, useEffect, useRef } from 'react';
import jcgmailImage from '../assets/jcgmail.png';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/Dashboard.css';

// Add Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lyamRhIiwiYSI6ImNtN3Y2ZW0waDA4YW8yanB3d2h3ajNiZmQifQ.X3FF0WM-nmIy1DS5-NixLA';

interface LocationDetails {
  city: string;
  state: string;
  zipCode: string;
  coordinates?: [number, number];
}

const Dashboard = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const deliveryMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [draftDetails, setDraftDetails] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [pickupDetails, setPickupDetails] = useState<LocationDetails | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState<LocationDetails | null>(null);
  const [variables, setVariables] = useState({
    driverName: '',
    carrierName: '',
    driverRate: '',
    brokerRate: '',
    emptyMiles: '',
    loadedMiles: ''
  });
  const [debouncedVariables, setDebouncedVariables] = useState(variables);

  // Add debounce effect for variables
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVariables(variables);
    }, 200);

    return () => clearTimeout(timer);
  }, [variables]);

  const searchLocation = async (query: string): Promise<LocationDetails | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=US&types=postcode&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [longitude, latitude] = feature.center;
        const context = feature.context || [];
        
        const state = context.find((item: any) => item.id.startsWith('region'))?.text || '';
        const city = context.find((item: any) => item.id.startsWith('place'))?.text || '';
        
        return {
          city,
          state,
          zipCode: feature.text,
          coordinates: [longitude, latitude]
        };
      }
      return null;
    } catch (error) {
      console.error('Error searching location:', error);
      return null;
    }
  };

  const updateMapMarkers = (details: LocationDetails | null, type: 'pickup' | 'delivery') => {
    if (!map || !details?.coordinates) return;

    const markerRef = type === 'pickup' ? pickupMarkerRef : deliveryMarkerRef;
    
    // Remove existing marker if any
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create new marker
    const marker = new mapboxgl.Marker({
      color: type === 'pickup' ? '#4CAF50' : '#C70039'
    })
      .setLngLat(details.coordinates)
      .addTo(map);

    markerRef.current = marker;

    // If both markers exist, fit bounds to show both
    if (pickupMarkerRef.current && deliveryMarkerRef.current) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend(pickupMarkerRef.current.getLngLat())
        .extend(deliveryMarkerRef.current.getLngLat());

      map.fitBounds(bounds, {
        padding: 100,
        duration: 1000
      });
    } else {
      // If only one marker, center on it
      map.flyTo({
        center: details.coordinates,
        zoom: 8,
        duration: 1000
      });
    }
  };

  const handleLocationChange = async (
    value: string,
    type: 'pickup' | 'delivery'
  ) => {
    if (type === 'pickup') {
      setPickupLocation(value);
      if (value.match(/^\d{5}$/)) {
        const details = await searchLocation(value);
        if (details) {
          setPickupDetails(details);
          updateMapMarkers(details, 'pickup');
        }
      }
    } else {
      setDeliveryLocation(value);
      if (value.match(/^\d{5}$/)) {
        const details = await searchLocation(value);
        if (details) {
          setDeliveryDetails(details);
          updateMapMarkers(details, 'delivery');
        }
      }
    }
  };

  useEffect(() => {
    const initializeMap = () => {
      const mapInstance = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-95.7129, 37.0902],
        zoom: 3
      });

      mapInstance.addControl(new mapboxgl.NavigationControl());

      setMap(mapInstance);
    };

    if (!map) {
      initializeMap();
    }

    return () => {
      map?.remove();
    };
  }, [map]);

  const formatCurrency = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(numericValue));
  };

  const calculateMargin = () => {
    const driverAmount = Number(debouncedVariables.driverRate.replace(/[^0-9.]/g, ''));
    const brokerAmount = Number(debouncedVariables.brokerRate.replace(/[^0-9.]/g, ''));
    
    if (brokerAmount && driverAmount) {
      const difference = brokerAmount - driverAmount;
      const percentage = (difference / brokerAmount) * 100;
      return {
        amount: formatCurrency(difference.toString()),
        percentage: percentage.toFixed(1) + '%'
      };
    }
    return { amount: '$0.00', percentage: '0%' };
  };

  const calculateRatePerMile = () => {
    const driverAmount = Number(debouncedVariables.driverRate.replace(/[^0-9.]/g, ''));
    const totalMiles = Number(debouncedVariables.emptyMiles) + Number(debouncedVariables.loadedMiles);
    
    if (driverAmount && totalMiles) {
      const ratePerMile = driverAmount / totalMiles;
      return `$${ratePerMile.toFixed(2)}/mi`;
    }
    return '$0.00/mi';
  };

  const handleHomeClick = () => {
    window.location.href = '/';
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText('#SP987654210')
      .then(() => {
        console.log('Invoice ID copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDraftDetails(text);

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const newVariables = {
      driverName: '',
      carrierName: '',
      driverRate: '',
      brokerRate: '',
      emptyMiles: '',
      loadedMiles: ''
    };

    lines.forEach((line, index) => {
      if (index === 0) newVariables.driverName = line;
      if (index === 1) newVariables.carrierName = line;
      if (index === 2) newVariables.driverRate = line;
      if (index === 3) newVariables.brokerRate = line;
      if (index === 4) newVariables.emptyMiles = line;
      if (index === 5) newVariables.loadedMiles = line;
    });

    setVariables(newVariables);
  };

  const margin = calculateMargin();

  return (
    <div className="dashboard">
      <button className="home-button" onClick={handleHomeClick}>
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="dashboard-header">
        <img src={jcgmailImage} alt="JCG Mail" className="dashboard-logo" />
      </div>
      <div className="dashboard-container">
        <div className="metric-card">
          <div className="tracking-section">
            <div className="tracking-header">
              <h2 className="tracking-title">Add a draft load</h2>
            </div>
            
            <div className="shipping-info">
              <div className="invoice-info">
                <span className="label">Invoice ID:</span>
                <span className="value">#SP987654210</span>
                <button className="copy-button" onClick={handleCopyClick} title="Copy Invoice ID">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z" />
                    <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" />
                  </svg>
                </button>
              </div>
              <div className="shipping-status">In Transit</div>
            </div>

            <div className="info-row">
              <div className="info-column">
                <h3 className="info-label">Driver name:</h3>
                <span className="info-value">[{debouncedVariables.driverName || 'Insert value 1st line'}]</span>
              </div>
              <div className="info-divider"></div>
              <div className="info-column">
                <h3 className="info-label">Carrier:</h3>
                <span className="info-value">[{debouncedVariables.carrierName || 'Insert value 2nd line'}]</span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill"></div>
                <div className="progress-marker marker-start"></div>
                <div className="progress-marker marker-current">
                  <div className="truck-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 3h15v13H1z"/>
                      <path d="M16 8h4l3 3v5h-7V8z"/>
                      <circle cx="5.5" cy="16.5" r="2.5"/>
                      <circle cx="19.5" cy="16.5" r="2.5"/>
                    </svg>
                    <span className="rate-per-mile">{calculateRatePerMile()}</span>
                  </div>
                </div>
                <div className="progress-marker marker-end"></div>
              </div>
              <div className="progress-labels">
                <span className="progress-label">
                  PU
                  {pickupLocation && (
                    <div className="progress-location">
                      <span className="progress-location-text">
                        {pickupDetails?.zipCode || pickupLocation}
                      </span>
                      {pickupDetails && (
                        <span className="progress-location-details">
                          {pickupDetails.city}, {pickupDetails.state}
                        </span>
                      )}
                      <span className="progress-miles">
                        {debouncedVariables.emptyMiles ? `${debouncedVariables.emptyMiles} mi` : '0 mi'}
                      </span>
                    </div>
                  )}
                </span>
                <span className="progress-label">
                  DL
                  {deliveryLocation && (
                    <div className="progress-location">
                      <span className="progress-location-text">
                        {deliveryDetails?.zipCode || deliveryLocation}
                      </span>
                      {deliveryDetails && (
                        <span className="progress-location-details">
                          {deliveryDetails.city}, {deliveryDetails.state}
                        </span>
                      )}
                      <span className="progress-miles">
                        {debouncedVariables.loadedMiles ? `${debouncedVariables.loadedMiles} mi` : '0 mi'}
                      </span>
                    </div>
                  )}
                </span>
              </div>
            </div>

            <div className="rates-box">
              <div className="rate-column">
                <h4 className="rate-label">DRIVER RATE</h4>
                <span className="rate-value">{formatCurrency(debouncedVariables.driverRate.replace(/[^0-9.]/g, '') || '0')}</span>
              </div>
              <div className="rate-divider"></div>
              <div className="rate-column">
                <h4 className="rate-label">BROKER RATE</h4>
                <span className="rate-value">{formatCurrency(debouncedVariables.brokerRate.replace(/[^0-9.]/g, '') || '0')}</span>
              </div>
              <div className="rate-divider"></div>
              <div className="rate-column">
                <h4 className="rate-label">MARGIN</h4>
                <div className="margin-values">
                  <span className="rate-value">{margin.amount}</span>
                  <span className="margin-percentage">({margin.percentage})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="status-section">
            <div className="status-card">
              <div className="status-info">
                <div className="status-id">ID #3214BD</div>
                <div className="status-date">17/09/2023</div>
              </div>
              <div className="status-badge on-delivery">ON DELIVERY</div>
            </div>

            <div className="status-card">
              <div className="status-info">
                <div className="status-id">ID #21312CC</div>
                <div className="status-date">15/09/2023</div>
              </div>
              <div className="status-badge rejected">REJECTED</div>
            </div>

            <div className="status-card">
              <div className="status-info">
                <div className="status-id">ID #34242CA</div>
                <div className="status-date">15/09/2023</div>
              </div>
              <div className="status-badge on-transit">ON TRANSIT</div>
            </div>

            <div className="status-card">
              <div className="status-info">
                <div className="status-id">ID #101832BA</div>
                <div className="status-date">15/09/2023</div>
              </div>
              <div className="status-badge completed">COMPLETED</div>
            </div>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-card">
            <div className="draft-input-section">
              <div className="draft-text-section">
                <h3 className="draft-input-title">
                  Insert Draft load details
                  <span className="info-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <div className="info-tooltip">
                      Enter the draft load details here (one value per line):

1. Driver Name
2. Carrier Name
3. Driver Rate
4. Broker Rate
5. Empty Miles
6. Loaded Miles
                    </div>
                  </span>
                </h3>
                <textarea
                  className="draft-textarea"
                  value={draftDetails}
                  onChange={handleDraftChange}
                  placeholder="Enter your draft load details here..."
                  aria-label="Draft load details"
                />
              </div>
              <div className="location-fields-container">
                <h3 className="draft-input-title">Location Details</h3>
                <div className="location-fields">
                  <div className="location-field">
                    <label className="location-label">Pickup</label>
                    <div className="location-input-wrapper">
                      <input
                        type="text"
                        className="location-input"
                        value={pickupLocation}
                        onChange={(e) => handleLocationChange(e.target.value, 'pickup')}
                        placeholder="Enter city or zip code"
                      />
                      {pickupDetails && (
                        <div className="location-details">
                          <span className="location-city">{pickupDetails.city}, {pickupDetails.state}</span>
                          {pickupDetails.zipCode && (
                            <span className="location-zip">ZIP: {pickupDetails.zipCode}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="location-field">
                    <label className="location-label">Delivery</label>
                    <div className="location-input-wrapper">
                      <input
                        type="text"
                        className="location-input"
                        value={deliveryLocation}
                        onChange={(e) => handleLocationChange(e.target.value, 'delivery')}
                        placeholder="Enter city or zip code"
                      />
                      {deliveryDetails && (
                        <div className="location-details">
                          <span className="location-city">{deliveryDetails.city}, {deliveryDetails.state}</span>
                          {deliveryDetails.zipCode && (
                            <span className="location-zip">ZIP: {deliveryDetails.zipCode}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="chart-card">
            <h3 className="draft-input-title">Route Map</h3>
            <div id="map" className="map-container"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 