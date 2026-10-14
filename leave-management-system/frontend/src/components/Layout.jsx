import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NotificationToast from './NotificationToast';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <NotificationToast />
      <Navbar />
      <main className="main-content" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
