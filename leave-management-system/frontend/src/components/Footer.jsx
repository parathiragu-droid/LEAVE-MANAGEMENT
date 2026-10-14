import React from 'react';
import './Footer.css';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-container">
        <p className="footer-text">
          Leave Management System &copy; {currentYear}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
