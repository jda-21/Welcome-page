import { useState } from 'react';
import truckBgImage from '../assets/Truck-bg.jpeg';
import jcgmailImage from '../assets/jcgmail.png';
import LoadingPage from './LoadingPage';
import '../styles/Card.css';

const Card = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingPage onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Welcome Stranger</h1>
        <div className="content-section">
          <div className="truck-image-container" onClick={handleClick} role="button" tabIndex={0}>
            <img src={truckBgImage} alt="Truck" className="truck-image" />
          </div>
          <div className="button-container">
            <button className="cta-button" onClick={handleClick}>
              Ready to explore
            </button>
          </div>
        </div>
        <div className="credit-section">
          <img src={jcgmailImage} alt="JCG Mail" className="credit-image" />
          <p className="credit-text">Dev by JDA</p>
        </div>
      </div>
    </div>
  );
};

export default Card; 