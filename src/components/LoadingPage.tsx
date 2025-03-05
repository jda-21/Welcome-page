import { FC, useEffect } from 'react';
import { useLottie } from 'lottie-react';
import jcgmailImage from '../assets/jcgmail.png';
import LoadingAnimation from './LoadingAnimation';
import truckAnimation from '../animations/truck.json';
import '../styles/LoadingPage.css';

interface LoadingPageProps {
  onLoadingComplete: () => void;
}

const LoadingPage: FC<LoadingPageProps> = ({ onLoadingComplete }) => {
  const { View: TruckAnimation } = useLottie({
    animationData: truckAnimation,
    loop: true,
    autoplay: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className="loading-page">
      <div className="loading-content">
        <div className="truck-container">
          {TruckAnimation}
        </div>
        <div className="loading-indicator">
          <LoadingAnimation />
          <p className="loading-message">We're putting the finishing touches on everything</p>
        </div>
      </div>
      <div className="loading-footer">
        <img src={jcgmailImage} alt="JCG Mail" className="credit-image" />
        <p className="credit-text">Dev by JDA</p>
      </div>
    </div>
  );
};

export default LoadingPage; 