'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaFileContract, FaScroll, FaShieldAlt, FaArrowUp, FaHome } from 'react-icons/fa';
import Image from 'next/image';
import Terms from '../../components/Terms';
import Agreement from '../../components/Agreement';
import Policy from '../../components/Policy';

const LegalDocumentsPage = () => {
    const [activeDocument, setActiveDocument] = useState('terms');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const contentRef = useRef(null);
    
    const documents = [
        { id: 'terms', name: 'Terms', icon: <FaFileContract />, fullName: 'Terms of Service' },
        { id: 'agreement', name: 'Agreement', icon: <FaScroll />, fullName: 'User Agreement' },
        { id: 'policy', name: 'Policy', icon: <FaShieldAlt />, fullName: 'Privacy Policy' }
    ];
    
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);
    
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const renderActiveDocument = () => {
        switch (activeDocument) {
            case 'terms':
                return <Terms />;
            case 'agreement':
                return <Agreement />;
            case 'policy':
                return <Policy />;
            default:
                return <Terms />;
        }
    };
    
    return (
        <div className="legal-documents-page">
            {/* Header with Logo and Tabs */}
            <header className="page-header">
                <div className="container header-container">
                    {/* Logo */}
                    <a href="/" className="logo-link">
                        <Image
                            src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/glogo.png"
                            alt="Gleedz Logo"
                            width={isMobile ? 90 : 120}
                            height={isMobile ? 27 : 36}
                            className="logo-image"
                            priority
                        />
                    </a>
                    
                    {/* Document Tabs */}
                    <div className="document-tabs">
                        {documents.map((doc) => (
                            <button
                                key={doc.id}
                                className={`tab-button ${activeDocument === doc.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveDocument(doc.id);
                                    scrollToTop();
                                }}
                            >
                                <span className="tab-icon">{doc.icon}</span>
                                {!isMobile && (
                                    <span className="tab-text">{doc.name}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    
                    {/* Home Button */}
                    <a href="/" className="home-button">
                        <FaHome className="home-icon" />
                        {!isMobile && <span>Home</span>}
                    </a>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="container main-content" ref={contentRef}>
                {/* Page Title */}
                <div className="page-title-section">
                    <h1>Legal Documents</h1>
                    <p className="page-subtitle">
                        Important information about using Gleedz platform. Please read carefully.
                    </p>
                </div>
                
                {/* Active Document Indicator */}
                <div className="active-document-indicator">
                    <div className="active-document-icon">
                        {documents.find(doc => doc.id === activeDocument)?.icon}
                    </div>
                    <div>
                        <h2 className="active-document-title">
                            {documents.find(doc => doc.id === activeDocument)?.fullName}
                        </h2>
                        <p className="active-document-description">
                            {activeDocument === 'terms' && 'Platform rules and conditions'}
                            {activeDocument === 'agreement' && 'User rights and responsibilities'}
                            {activeDocument === 'policy' && 'Data collection and protection'}
                        </p>
                    </div>
                </div>
                
                {/* Document Content */}
                <div className="document-content">
                    {renderActiveDocument()}
                </div>
                
                {/* Document Switcher */}
                <div className="document-switcher">
                    <div className="switcher-header">
                        <h3>Other Legal Documents</h3>
                        <p>View our other important documents</p>
                    </div>
                    <div className="switcher-buttons">
                        {documents
                            .filter(doc => doc.id !== activeDocument)
                            .map((doc) => (
                                <button
                                    key={doc.id}
                                    className="switcher-button"
                                    onClick={() => {
                                        setActiveDocument(doc.id);
                                        scrollToTop();
                                    }}
                                >
                                    <span className="switcher-icon">{doc.icon}</span>
                                    <span className="switcher-text">
                                        <strong>{doc.fullName}</strong>
                                        <span>
                                            {doc.id === 'terms' && 'Platform rules and conditions'}
                                            {doc.id === 'agreement' && 'User rights and responsibilities'}
                                            {doc.id === 'policy' && 'Data collection and protection'}
                                        </span>
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>
            </main>
            
            {/* Back to Top Button */}
            {showBackToTop && (
                <button className="back-to-top" onClick={scrollToTop}>
                    <FaArrowUp />
                </button>
            )}
            
            <style jsx>{`
                :root {
                    --yellow-500: #FBBF24;
                    --yellow-600: #D97706;
                    --yellow-700: #B45309;
                    --gray-50: #fbfaf9;
                    --gray-100: #F3F4F6;
                    --gray-200: #ebeae5;
                    --gray-300: #D1D5DB;
                    --gray-400: #9CA3AF;
                    --gray-500: #6B7280;
                    --gray-600: #4B5563;
                    --gray-700: #374151;
                    --gray-800: #1F2937;
                    --gray-900: #111827;
                }
                
                .legal-documents-page {
                    background: linear-gradient(135deg, #f7f3e8 0%, #f6ebc0 100%);
                    color: var(--gray-800);
                    line-height: 1.6;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    min-height: 100vh;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }
                
                /* Header Styles - DARK BACKGROUND */
                .page-header {
                    background: linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%);
                    padding: 0.8rem 0;
                    box-shadow: 0 4px 20px rgba(244, 192, 22, 0.08);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(251, 191, 36, 0.2);
                }
                
                .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                }
                
                .logo-link {
                    display: flex;
                    align-items: center;
                }
                
                .logo-image {
                    object-fit: contain;
                }
                
                /* Document Tabs */
                .document-tabs {
                    display: flex;
                    gap: 0.5rem;
                    flex: 1;
                    justify-content: center;
                    max-width: 400px;
                }
                
                .tab-button {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 1rem;
                    background: rgba(157, 106, 10, 0.57);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    color: white;
                    font-weight: 500;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    min-height: 36px;
                }
                
                .tab-button:hover {
                    background: var(--yellow-500);
                    border-color: var(--yellow-500);
                    color: var(--gray-900);
                }
                
                .tab-button.active {
                    background: var(--yellow-500);
                    border-color: var(--yellow-500);
                    color: var(--gray-900);
                    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
                }
                
                .tab-button.active:hover {
                    background: var(--yellow-600);
                    border-color: var(--yellow-600);
                }
                
                .tab-icon {
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                }
                
                /* Home Button */
                .home-button {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.85rem;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    background: rgba(127, 102, 5, 0.55);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.2s;
                    min-height: 36px;
                }
                
                .home-button:hover {
                    background: var(--yellow-500);
                    border-color: var(--yellow-500);
                    color: var(--gray-900);
                }
                
                .home-icon {
                    font-size: 0.9rem;
                }
                
                /* Main Content */
                .main-content {
                    padding: 2rem 0 3rem;
                }
                
                /* Page Title */
                .page-title-section {
                    text-align: center;
                    margin-bottom: 2.5rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 2px solid var(--yellow-500);
                }
                
                .page-title-section h1 {
                    font-size: 2.2rem;
                    color: var(--gray-900);
                    margin-bottom: 0.8rem;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                
                .page-subtitle {
                    font-size: 1rem;
                    color: var(--gray-600);
                    max-width: 700px;
                    margin: 0 auto;
                    line-height: 1.7;
                }
                
                /* Active Document Indicator */
                .active-document-indicator {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
                    padding: 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    border: 1px solid rgba(251, 191, 36, 0.2);
                }
                
                .active-document-icon {
                    width: 60px;
                    height: 60px;
                    background: var(--yellow-500);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    color: white;
                    flex-shrink: 0;
                }
                
                .active-document-title {
                    font-size: 1.6rem;
                    color: var(--gray-900);
                    margin-bottom: 0.3rem;
                    font-weight: 700;
                }
                
                .active-document-description {
                    font-size: 0.95rem;
                    color: var(--gray-600);
                }
                
                /* Document Content */
                .document-content {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
                    border: 1px solid var(--gray-200);
                    margin-bottom: 2.5rem;
                }
                
                /* Component Styles */
                .terms-component, .agreement-component, .policy-component {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }
                
                .terms-section, .agreement-section, .policy-section {
                    margin-bottom: 0.5rem;
                }
                
                .terms-section h2, .agreement-section h2, .policy-section h2 {
                    font-size: 1.3rem;
                    margin-bottom: 1rem;
                    color: var(--gray-900);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid var(--gray-200);
                }
                
                .terms-section h2 .icon, 
                .agreement-section h2 .icon, 
                .policy-section h2 .icon {
                    color: var(--yellow-500);
                    font-size: 1.1rem;
                }
                
                .terms-section p, 
                .agreement-section p, 
                .policy-section p {
                    margin-bottom: 1rem;
                    color: var(--gray-700);
                    font-size: 0.94rem;
                    line-height: 1.7;
                }
                
                .terms-section ul, 
                .agreement-section ul, 
                .policy-section ul {
                    margin-left: 1.2rem;
                    margin-bottom: 1.2rem;
                }
                
                .terms-section li, 
                .agreement-section li, 
                .policy-section li {
                    margin-bottom: 0.6rem;
                    color: var(--gray-700);
                    font-size: 0.92rem;
                    line-height: 1.6;
                }
                
                .highlight-term, .highlight-agreement, .highlight-policy {
                    background: linear-gradient(to right, rgba(251, 191, 36, 0.05), rgba(251, 191, 36, 0.02));
                    padding: 1.2rem;
                    border-left: 4px solid var(--yellow-500);
                    border-radius: 0 10px 10px 0;
                    margin: 1.2rem 0;
                    border: 1px solid rgba(251, 191, 36, 0.15);
                }
                
                .highlight-term h3, .highlight-agreement h3, .highlight-policy h4 {
                    color: var(--yellow-600);
                    margin-bottom: 0.8rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                
                /* Document Switcher */
                .document-switcher {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
                    border: 1px solid var(--gray-200);
                }
                
                .switcher-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }
                
                .switcher-header h3 {
                    font-size: 1.3rem;
                    color: var(--gray-900);
                    margin-bottom: 0.5rem;
                    font-weight: 700;
                }
                
                .switcher-header p {
                    color: var(--gray-600);
                    font-size: 0.9rem;
                }
                
                .switcher-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .switcher-button {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.2rem;
                    background: white;
                    border: 2px solid var(--gray-200);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    width: 100%;
                }
                
                .switcher-button:hover {
                    border-color: var(--yellow-500);
                    background: rgba(251, 191, 36, 0.05);
                    transform: translateX(3px);
                }
                
                .switcher-icon {
                    font-size: 1.3rem;
                    color: var(--yellow-600);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(251, 191, 36, 0.1);
                    border-radius: 10px;
                }
                
                .switcher-text {
                    flex: 1;
                }
                
                .switcher-text strong {
                    display: block;
                    font-size: 1rem;
                    color: var(--gray-900);
                    margin-bottom: 0.2rem;
                }
                
                .switcher-text span {
                    font-size: 0.88rem;
                    color: var(--gray-600);
                }
                
                /* Back to Top Button */
                .back-to-top {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 45px;
                    height: 45px;
                    background: var(--yellow-500);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
                    transition: all 0.3s;
                    z-index: 1000;
                }
                
                .back-to-top:hover {
                    background: var(--yellow-700);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
                }
                
                /* Responsive - MOBILE (768px and below) */
                @media (max-width: 768px) {
                    .container {
                        padding: 0 16px;
                    }
                    
                    .header-container {
                        gap: 0.8rem;
                    }
                    
                    /* Mobile: Logo smaller */
                    .logo-image {
                        width: 80px;
                        height: 24px;
                    }
                    
                    /* Mobile: Tabs smaller - icons only */
                    .document-tabs {
                        max-width: 200px;
                        gap: 0.3rem;
                    }
                    
                    .tab-button {
                        padding: 0.4rem;
                        min-width: 40px;
                        min-height: 32px;
                        justify-content: center;
                    }
                    
                    .tab-text {
                        display: none;
                    }
                    
                    .tab-icon {
                        font-size: 0.8rem;
                    }
                    
                    /* Mobile: Home button smaller */
                    .home-button {
                        padding: 0.4rem;
                        min-width: 40px;
                        min-height: 32px;
                        justify-content: center;
                    }
                    
                    .home-button span {
                        display: none;
                    }
                    
                    .home-icon {
                        font-size: 0.8rem;
                    }
                    
                    /* Mobile: Title smaller */
                    .page-title-section h1 {
                        font-size: 1.8rem;
                    }
                    
                    .page-subtitle {
                        font-size: 0.9rem;
                        padding: 0 10px;
                    }
                    
                    /* Mobile: Active document indicator smaller */
                    .active-document-indicator {
                        padding: 1rem;
                        gap: 1rem;
                    }
                    
                    .active-document-icon {
                        width: 45px;
                        height: 45px;
                        font-size: 1.4rem;
                    }
                    
                    .active-document-title {
                        font-size: 1.3rem;
                    }
                    
                    .active-document-description {
                        font-size: 0.85rem;
                    }
                    
                    /* Mobile: Document content smaller */
                    .document-content {
                        padding: 1.2rem;
                        border-radius: 12px;
                    }
                    
                    /* Mobile: Text sizes smaller */
                    .terms-section h2, .agreement-section h2, .policy-section h2 {
                        font-size: 1.1rem;
                    }
                    
                    .terms-section p, .agreement-section p, .policy-section p {
                        font-size: 0.88rem;
                        line-height: 1.6;
                    }
                    
                    .terms-section li, .agreement-section li, .policy-section li {
                        font-size: 0.85rem;
                        line-height: 1.5;
                    }
                    
                    .highlight-term h3, .highlight-agreement h3, .highlight-policy h4 {
                        font-size: 1rem;
                    }
                    
                    .highlight-term, .highlight-agreement, .highlight-policy {
                        padding: 1rem;
                    }
                    
                    /* Mobile: Switcher smaller */
                    .document-switcher {
                        padding: 1.2rem;
                    }
                    
                    .switcher-header h3 {
                        font-size: 1.1rem;
                    }
                    
                    .switcher-button {
                        padding: 0.8rem;
                        gap: 0.8rem;
                    }
                    
                    .switcher-text strong {
                        font-size: 0.95rem;
                    }
                    
                    .switcher-text span {
                        font-size: 0.82rem;
                    }
                    
                    .switcher-icon {
                        font-size: 1.1rem;
                        width: 35px;
                        height: 35px;
                    }
                    
                    /* Mobile: Back to top smaller */
                    .back-to-top {
                        bottom: 20px;
                        right: 20px;
                        width: 40px;
                        height: 40px;
                        font-size: 1rem;
                    }
                }
                
                /* Extra small mobile (480px and below) */
                @media (max-width: 480px) {
                    .page-title-section h1 {
                        font-size: 1.6rem;
                    }
                    
                    .active-document-title {
                        font-size: 1.2rem;
                    }
                    
                    .logo-image {
                        width: 70px;
                        height: 21px;
                    }
                    
                    .tab-button {
                        padding: 0.35rem;
                        min-width: 35px;
                        min-height: 30px;
                    }
                    
                    .home-button {
                        padding: 0.35rem;
                        min-width: 35px;
                        min-height: 30px;
                    }
                    
                    .document-tabs {
                        max-width: 180px;
                        gap: 0.25rem;
                    }
                    
                    .terms-section h2, .agreement-section h2, .policy-section h2 {
                        font-size: 1rem;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 5px;
                    }
                    
                    .terms-section h2 .icon, 
                    .agreement-section h2 .icon, 
                    .policy-section h2 .icon {
                        margin-bottom: 5px;
                    }
                    
                    .document-content {
                        padding: 1rem;
                    }
                }
                
                /* Very small mobile (360px and below) */
                @media (max-width: 360px) {
                    .header-container {
                        gap: 0.5rem;
                    }
                    
                    .logo-image {
                        width: 65px;
                        height: 20px;
                    }
                    
                    .document-tabs {
                        max-width: 160px;
                    }
                    
                    .tab-button {
                        min-width: 32px;
                        min-height: 28px;
                    }
                    
                    .home-button {
                        min-width: 32px;
                        min-height: 28px;
                    }
                    
                    .active-document-indicator {
                        flex-direction: column;
                        text-align: center;
                        gap: 0.8rem;
                    }
                    
                    .active-document-icon {
                        margin: 0 auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default LegalDocumentsPage;