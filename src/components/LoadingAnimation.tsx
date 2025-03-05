import { FC } from 'react';
import '../styles/LoadingAnimation.css';

const LoadingAnimation: FC = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p className="loading-text">Loading...</p>
    </div>
  );
};

export default LoadingAnimation; 