import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import '../styles/layout.css';

const Layout: React.FC = () => {
    return (
        <>
            <AppHeader />
            <main className="main-content">
                <div className="page-inner">
                    <Outlet />
                </div>
            </main>
        </>
    );
};

export default Layout;
