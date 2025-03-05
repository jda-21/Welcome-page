import { FC } from 'react';
import '../styles/Card.css';

interface CardProps {
  onSendMessage: () => void;
}

const Card: FC<CardProps> = ({ onSendMessage }) => {
  return (
    <div className="container">
      <div className="card">
        <h1>Work fast. Live slow.</h1>
        <h2>Transform your digital presence.</h2>
        <p>From zero to extraordinary. Let's create your digital reality.</p>
        <button className="cta-button" onClick={onSendMessage}>
          Send a message
        </button>
        <div className="footer">
          <div className="brand">sukoya.design</div>
          <div className="services">web + product + brand</div>
        </div>
      </div>
    </div>
  );
};

export default Card; 