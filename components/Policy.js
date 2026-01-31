'use client';

import React, { useState } from 'react';
import { 
    FaShieldAlt, FaUserCircle, FaDatabase, FaCookie, 
    FaEye, FaTrashAlt, FaEnvelope, FaGlobe, FaLock, 
    FaUserFriends, FaChevronDown, FaChevronUp, 
    FaDownload, FaPrint, FaShareAlt, FaCopy,
    FaCheckCircle, FaRegClock, FaUserEdit,
    FaRegEye, FaRegEyeSlash, FaKey, FaServer,
    FaHistory, FaRegFileAlt, FaQuestionCircle,
    FaExclamationTriangle, FaBell, FaCogs
} from 'react-icons/fa';

const PrivacyPolicy = () => {
    const [expandedSections, setExpandedSections] = useState(['introduction']);
    const [cookieSettings, setCookieSettings] = useState({
        essential: true,
        analytics: true,
        marketing: false
    });
    const [privacyPreferences, setPrivacyPreferences] = useState({
        profileVisibility: 'public',
        emailNotifications: true,
        locationSharing: false
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const toggleCookie = (cookieType) => {
        if (cookieType === 'essential') return; // Can't disable essential cookies
        setCookieSettings(prev => ({
            ...prev,
            [cookieType]: !prev[cookieType]
        }));
    };

    const togglePreference = (preference) => {
        setPrivacyPreferences(prev => ({
            ...prev,
            [preference]: typeof prev[preference] === 'boolean' 
                ? !prev[preference] 
                : prev[preference]
        }));
    };

    const sections = [
        {
            id: 'introduction',
            icon: <FaShieldAlt />,
            title: 'Introduction',
            content: [
                "Gleedz Technologies ('we', 'us', or 'our') operates the Gleedz platform (the 'Service').",
                "This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.",
                "We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy."
            ],
            lastUpdated: 'June 1, 2024',
            effectiveDate: 'June 1, 2024'
        },
        {
            id: 'information-collected',
            icon: <FaUserCircle />,
            title: 'Information We Collect',
            dataTypes: [
                {
                    category: 'Personal Information',
                    icon: <FaUserFriends />,
                    items: [
                        'Name, email address, phone number, date of birth',
                        'Profile picture, biography, social media links',
                        'Mailing address (for prize fulfillment)',
                        'Government ID (required for Event Producers verification)'
                    ],
                    purpose: 'Account creation and user verification'
                },
                {
                    category: 'Usage Data',
                    icon: <FaDatabase />,
                    items: [
                        'Events created, participated in, or voted on',
                        'Token purchases, ticket sales, withdrawals',
                        'IP address, browser type, device type',
                        'Country and city based on IP address'
                    ],
                    purpose: 'Service improvement and analytics'
                },
                {
                    category: 'Cookies & Tracking',
                    icon: <FaCookie />,
                    items: [
                        'Session cookies for authentication',
                        'Analytics cookies for usage patterns',
                        'Preference cookies for personalization',
                        'Security cookies for protection'
                    ],
                    purpose: 'Enhanced user experience and security'
                }
            ]
        },
        {
            id: 'data-usage',
            icon: <FaEye />,
            title: 'How We Use Your Information',
            purposes: [
                {
                    title: 'Service Operation',
                    items: [
                        'Create and manage your Gleedz account',
                        'Process transactions and token purchases',
                        'Facilitate event participation and voting',
                        'Provide customer support and technical assistance'
                    ],
                    legalBasis: 'Contractual necessity'
                },
                {
                    title: 'Communication',
                    items: [
                        'Send important service announcements',
                        'Notify about event updates and results',
                        'Share platform news and feature updates',
                        'Respond to inquiries and support requests'
                    ],
                    legalBasis: 'Legitimate interest'
                },
                {
                    title: 'Improvement & Security',
                    items: [
                        'Analyze platform usage and performance',
                        'Develop new features and improve existing ones',
                        'Detect and prevent fraudulent activities',
                        'Ensure platform security and integrity'
                    ],
                    legalBasis: 'Legitimate interest'
                }
            ]
        },
        {
            id: 'data-protection',
            icon: <FaLock />,
            title: 'Data Protection & Security',
            securityMeasures: [
                {
                    title: 'Encryption',
                    icon: <FaKey />,
                    description: 'All data transmitted is encrypted using SSL/TLS 1.3',
                    status: 'Active'
                },
                {
                    title: 'Secure Storage',
                    icon: <FaServer />,
                    description: 'Personal data stored on AWS servers with access controls',
                    status: 'Active'
                },
                {
                    title: 'Access Controls',
                    icon: <FaLock />,
                    description: 'Strict role-based access to sensitive data',
                    status: 'Active'
                },
                {
                    title: 'Regular Audits',
                    icon: <FaHistory />,
                    description: 'Security assessments conducted quarterly',
                    status: 'Scheduled'
                }
            ],
            retentionPeriods: [
                { type: 'Active Accounts', period: 'Indefinite (while active)' },
                { type: 'Inactive Accounts', period: '2 years' },
                { type: 'Transaction Records', period: '7 years' },
                { type: 'Event Data', period: 'Public data kept indefinitely' }
            ]
        },
        {
            id: 'your-rights',
            icon: <FaGlobe />,
            title: 'Your Rights & Choices',
            rights: [
                {
                    right: 'Right to Access',
                    description: 'View your personal data in account settings',
                    icon: <FaRegEye />,
                    action: 'View Data'
                },
                {
                    right: 'Right to Rectification',
                    description: 'Update inaccurate or incomplete information',
                    icon: <FaUserEdit />,
                    action: 'Edit Profile'
                },
                {
                    right: 'Right to Erasure',
                    description: 'Request deletion of your account and data',
                    icon: <FaTrashAlt />,
                    action: 'Delete Account'
                },
                {
                    right: 'Right to Data Portability',
                    description: 'Download your data in portable format',
                    icon: <FaDownload />,
                    action: 'Export Data'
                }
            ]
        },
        {
            id: 'contact',
            icon: <FaEnvelope />,
            title: 'Contact & Complaints',
            contacts: [
                {
                    role: 'Privacy Officer',
                    email: 'privacy@gleedz.com',
                    responseTime: 'Within 30 business days',
                    hours: 'Monday-Friday, 9AM-5PM EST'
                },
                {
                    role: 'Data Protection Authority',
                    email: 'info@nitda.gov.ng',
                    responseTime: 'Varies by jurisdiction',
                    description: 'National Information Technology Development Agency (NITDA) for Nigerian users'
                }
            ]
        }
    ];

    const handleExportData = () => {
        alert('Data export functionality would be implemented in production');
    };

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            alert('Account deletion request would be processed');
        }
    };

    const handleCopyPolicy = () => {
        navigator.clipboard.writeText('Gleedz Privacy Policy');
        alert('Policy link copied to clipboard!');
    };

    const handlePrintPolicy = () => {
        window.print();
    };

    const handleSharePolicy = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Gleedz Privacy Policy',
                    text: 'Read the Gleedz Privacy Policy',
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        }
    };

    return (
        <div className="privacy-container">
            {/* Header */}
            <div className="privacy-header">
                <div className="header-main">
                    <FaShieldAlt className="header-icon" />
                    <div>
                        <h1>Privacy Policy</h1>
                        <div className="header-details">
                            <span className="badge updated">Updated: June 1, 2024</span>
                            <span className="badge effective">Effective: June 1, 2024</span>
                            <span className="badge version">Version 3.2</span>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={handleExportData} className="action-btn" title="Export Your Data">
                        <FaDownload />
                        <span>Export Data</span>
                    </button>
                    <button onClick={handleCopyPolicy} className="action-btn" title="Copy Policy Link">
                        <FaCopy />
                        <span>Copy Link</span>
                    </button>
                    <button onClick={handlePrintPolicy} className="action-btn" title="Print">
                        <FaPrint />
                        <span>Print</span>
                    </button>
                    <button onClick={handleSharePolicy} className="action-btn share" title="Share">
                        <FaShareAlt />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {/* Privacy Controls Dashboard */}
            <div className="privacy-dashboard">
                <h3><FaCogs /> Your Privacy Controls</h3>
                <div className="controls-grid">
                    <div className="control-card">
                        <h4><FaCookie /> Cookie Settings</h4>
                        <div className="cookie-controls">
                            {Object.entries(cookieSettings).map(([key, value]) => (
                                <div key={key} className="cookie-item">
                                    <label className="cookie-toggle">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={() => toggleCookie(key)}
                                            disabled={key === 'essential'}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <div>
                                        <span className="cookie-name">{key.charAt(0).toUpperCase() + key.slice(1)} Cookies</span>
                                        <span className="cookie-status">
                                            {key === 'essential' ? 'Required' : value ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="control-card">
                        <h4><FaBell /> Communication Preferences</h4>
                        <div className="preference-controls">
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={privacyPreferences.emailNotifications}
                                        onChange={() => togglePreference('emailNotifications')}
                                    />
                                    <span>Email Notifications</span>
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={privacyPreferences.locationSharing}
                                        onChange={() => togglePreference('locationSharing')}
                                    />
                                    <span>Location Sharing</span>
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>Profile Visibility:</label>
                                <select 
                                    value={privacyPreferences.profileVisibility}
                                    onChange={(e) => setPrivacyPreferences(prev => ({...prev, profileVisibility: e.target.value}))}
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                    <option value="event-only">Event Participants Only</option>
                                </select>
                            </div>
                        </div>
                        <button className="save-btn" onClick={() => alert('Preferences saved!')}>
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>

            {/* Policy Content */}
            <div className="policy-content">
                {sections.map((section) => (
                    <section 
                        key={section.id} 
                        id={section.id}
                        className={`policy-section ${expandedSections.includes(section.id) ? 'expanded' : ''}`}
                    >
                        <div className="section-header" onClick={() => toggleSection(section.id)}>
                            <div className="section-title">
                                <span className="section-icon">{section.icon}</span>
                                <h2>{section.title}</h2>
                                {section.lastUpdated && (
                                    <span className="update-badge">
                                        <FaRegClock /> Updated {section.lastUpdated}
                                    </span>
                                )}
                            </div>
                            <button className="expand-btn">
                                {expandedSections.includes(section.id) ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>

                        {expandedSections.includes(section.id) && (
                            <div className="section-content">
                                {section.content && (
                                    <div className="content-text">
                                        {section.content.map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))}
                                    </div>
                                )}

                                {section.dataTypes && (
                                    <div className="data-types-grid">
                                        {section.dataTypes.map((dataType, idx) => (
                                            <div key={idx} className="data-type-card">
                                                <div className="data-type-header">
                                                    <span className="data-type-icon">{dataType.icon}</span>
                                                    <h4>{dataType.category}</h4>
                                                </div>
                                                <ul>
                                                    {dataType.items.map((item, itemIdx) => (
                                                        <li key={itemIdx}>{item}</li>
                                                    ))}
                                                </ul>
                                                <div className="data-purpose">
                                                    <FaEye className="purpose-icon" />
                                                    <span>Purpose: {dataType.purpose}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {section.purposes && (
                                    <div className="purposes-grid">
                                        {section.purposes.map((purpose, idx) => (
                                            <div key={idx} className="purpose-card">
                                                <h4>{purpose.title}</h4>
                                                <ul>
                                                    {purpose.items.map((item, itemIdx) => (
                                                        <li key={itemIdx}>{item}</li>
                                                    ))}
                                                </ul>
                                                <div className="legal-basis">
                                                    <FaRegFileAlt className="legal-icon" />
                                                    <span>Legal Basis: {purpose.legalBasis}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {section.securityMeasures && (
                                    <>
                                        <div className="security-grid">
                                            {section.securityMeasures.map((measure, idx) => (
                                                <div key={idx} className="security-card">
                                                    <div className="security-icon">{measure.icon}</div>
                                                    <h4>{measure.title}</h4>
                                                    <p>{measure.description}</p>
                                                    <span className={`status-badge ${measure.status.toLowerCase()}`}>
                                                        {measure.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="retention-table">
                                            <h4>Data Retention Periods</h4>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Data Type</th>
                                                        <th>Retention Period</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {section.retentionPeriods.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td>{item.type}</td>
                                                            <td><span className="retention-period">{item.period}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {section.rights && (
                                    <div className="rights-grid">
                                        {section.rights.map((right, idx) => (
                                            <div key={idx} className="right-card">
                                                <div className="right-header">
                                                    <span className="right-icon">{right.icon}</span>
                                                    <h4>{right.right}</h4>
                                                </div>
                                                <p>{right.description}</p>
                                                <button 
                                                    className="right-action-btn"
                                                    onClick={() => {
                                                        if (right.action === 'Delete Account') handleDeleteAccount();
                                                        else if (right.action === 'Export Data') handleExportData();
                                                        else alert(`${right.action} would be implemented`);
                                                    }}
                                                >
                                                    {right.action}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {section.contacts && (
                                    <div className="contacts-grid">
                                        {section.contacts.map((contact, idx) => (
                                            <div key={idx} className="contact-card">
                                                <h4>{contact.role}</h4>
                                                {contact.email && (
                                                    <div className="contact-detail">
                                                        <FaEnvelope />
                                                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                                    </div>
                                                )}
                                                {contact.responseTime && (
                                                    <div className="contact-detail">
                                                        <FaRegClock />
                                                        <span>Response: {contact.responseTime}</span>
                                                    </div>
                                                )}
                                                {contact.hours && (
                                                    <div className="contact-detail">
                                                        <FaRegClock />
                                                        <span>Hours: {contact.hours}</span>
                                                    </div>
                                                )}
                                                {contact.description && (
                                                    <p className="contact-description">{contact.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {section.id === 'your-rights' && (
                                    <div className="quick-action-bar">
                                        <button onClick={handleExportData} className="quick-action">
                                            <FaDownload /> Export My Data
                                        </button>
                                        <button onClick={handleDeleteAccount} className="quick-action danger">
                                            <FaTrashAlt /> Delete My Account
                                        </button>
                                        <button onClick={() => window.location.hash = 'contact'} className="quick-action">
                                            <FaEnvelope /> Contact Privacy Officer
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                ))}
            </div>

            {/* Footer */}
            <div className="privacy-footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <h4><FaQuestionCircle /> Need Help?</h4>
                        <p>Contact our Privacy Officer for any questions about your data</p>
                        <a href="mailto:privacy@gleedz.com" className="contact-link">
                            <FaEnvelope /> privacy@gleedz.com
                        </a>
                    </div>
                    <div className="footer-right">
                        <div className="compliance-badges">
                            <span className="compliance-badge">
                                <FaShieldAlt /> GDPR Compliant
                            </span>
                            <span className="compliance-badge">
                                <FaShieldAlt /> NDPR Compliant
                            </span>
                            <span className="compliance-badge">
                                <FaShieldAlt /> Data Protected
                            </span>
                        </div>
                        <p className="document-id">Document ID: PP-2024-001</p>
                    </div>
                </div>
            </div>

            {/* Floating Actions */}
            <div className="floating-actions">
                <button className="floating-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    ↑
                </button>
                <button className="floating-btn" onClick={() => document.getElementById('your-rights')?.scrollIntoView({ behavior: 'smooth' })}>
                    <FaGlobe />
                </button>
                <button className="floating-btn primary" onClick={() => toggleSection('contact')}>
                    <FaEnvelope />
                </button>
            </div>

            <style jsx>{`
                :root {
                    --primary: #10B981;
                    --primary-dark: #059669;
                    --primary-light: #A7F3D0;
                    --secondary: #3B82F6;
                    --danger: #EF4444;
                    --warning: #F59E0B;
                    --gray-50: #F9FAFB;
                    --gray-100: #F3F4F6;
                    --gray-200: #E5E7EB;
                    --gray-300: #D1D5DB;
                    --gray-400: #9CA3AF;
                    --gray-500: #6B7280;
                    --gray-600: #4B5563;
                    --gray-700: #374151;
                    --gray-800: #1F2937;
                    --gray-900: #111827;
                }

                .privacy-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                    background: linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%);
                    min-height: 100vh;
                }

                /* Header */
                .privacy-header {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.1);
                    border: 1px solid var(--gray-200);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .header-main {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .header-icon {
                    font-size: 3rem;
                    color: var(--primary);
                }

                .header-main h1 {
                    margin: 0;
                    color: var(--gray-900);
                    font-size: 2rem;
                    font-weight: 700;
                }

                .header-details {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                    flex-wrap: wrap;
                }

                .badge {
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .badge.updated {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--primary);
                }

                .badge.effective {
                    background: rgba(59, 130, 246, 0.1);
                    color: var(--secondary);
                }

                .badge.version {
                    background: rgba(245, 158, 11, 0.1);
                    color: var(--warning);
                }

                .header-actions {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: var(--gray-100);
                    border: 1px solid var(--gray-200);
                    border-radius: 10px;
                    color: var(--gray-700);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: var(--gray-200);
                    transform: translateY(-1px);
                }

                .action-btn.share {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--primary);
                    border-color: rgba(16, 185, 129, 0.2);
                }

                /* Privacy Dashboard */
                .privacy-dashboard {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
                    border: 1px solid var(--gray-200);
                }

                .privacy-dashboard h3 {
                    margin-top: 0;
                    color: var(--gray-900);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .controls-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .control-card {
                    background: var(--gray-50);
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid var(--gray-200);
                }

                .control-card h4 {
                    margin-top: 0;
                    color: var(--gray-900);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .cookie-controls,
                .preference-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .cookie-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid var(--gray-200);
                }

                .cookie-toggle {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }

                .cookie-toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 24px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }

                input:checked + .toggle-slider {
                    background-color: var(--primary);
                }

                input:checked + .toggle-slider:before {
                    transform: translateX(26px);
                }

                input:disabled + .toggle-slider {
                    background-color: var(--gray-300);
                    cursor: not-allowed;
                }

                .cookie-name {
                    display: block;
                    font-weight: 500;
                    color: var(--gray-900);
                }

                .cookie-status {
                    font-size: 0.85rem;
                    color: var(--gray-500);
                }

                .preference-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                }

                .preference-item label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    color: var(--gray-700);
                }

                .preference-item select {
                    padding: 0.5rem;
                    border-radius: 6px;
                    border: 1px solid var(--gray-300);
                    background: white;
                    color: var(--gray-700);
                }

                .save-btn {
                    margin-top: 1.5rem;
                    width: 100%;
                    padding: 0.75rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .save-btn:hover {
                    background: var(--primary-dark);
                    transform: translateY(-1px);
                }

                /* Policy Sections */
                .policy-section {
                    background: white;
                    border-radius: 16px;
                    margin-bottom: 1rem;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
                    transition: all 0.3s ease;
                    border: 1px solid var(--gray-200);
                }

                .policy-section.expanded {
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
                    border-color: var(--gray-300);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .section-header:hover {
                    background: var(--gray-50);
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .section-icon {
                    font-size: 1.5rem;
                    color: var(--primary);
                }

                .section-header h2 {
                    margin: 0;
                    font-size: 1.3rem;
                    color: var(--gray-900);
                }

                .update-badge {
                    padding: 0.25rem 0.75rem;
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--primary);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .expand-btn {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: var(--gray-500);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .expand-btn:hover {
                    background: var(--gray-100);
                    color: var(--gray-700);
                }

                .section-content {
                    padding: 0 2rem 2rem;
                }

                .content-text {
                    color: var(--gray-700);
                    line-height: 1.7;
                    margin-bottom: 2rem;
                }

                .content-text p {
                    margin-bottom: 1rem;
                }

                /* Data Types Grid */
                .data-types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .data-type-card {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02));
                    border: 1px solid rgba(16, 185, 129, 0.15);
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .data-type-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .data-type-icon {
                    font-size: 1.5rem;
                    color: var(--primary);
                }

                .data-type-card h4 {
                    margin: 0;
                    color: var(--gray-900);
                }

                .data-type-card ul {
                    margin: 0 0 1rem;
                    padding-left: 1.5rem;
                }

                .data-type-card li {
                    color: var(--gray-700);
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                }

                .data-purpose {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: white;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: var(--gray-600);
                }

                .purpose-icon {
                    color: var(--primary);
                }

                /* Purposes Grid */
                .purposes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .purpose-card {
                    background: var(--gray-50);
                    border: 1px solid var(--gray-200);
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .purpose-card h4 {
                    margin-top: 0;
                    color: var(--gray-900);
                    margin-bottom: 1rem;
                }

                .purpose-card ul {
                    margin: 0 0 1rem;
                    padding-left: 1.5rem;
                }

                .purpose-card li {
                    color: var(--gray-700);
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                }

                .legal-basis {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: white;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: var(--gray-600);
                }

                .legal-icon {
                    color: var(--warning);
                }

                /* Security Grid */
                .security-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .security-card {
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: 12px;
                    padding: 1.5rem;
                    text-align: center;
                    transition: transform 0.2s;
                }

                .security-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
                }

                .security-icon {
                    font-size: 2rem;
                    color: var(--primary);
                    margin-bottom: 1rem;
                }

                .security-card h4 {
                    margin: 0.5rem 0;
                    color: var(--gray-900);
                }

                .security-card p {
                    color: var(--gray-600);
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }

                .status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .status-badge.active {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--primary);
                }

                .status-badge.scheduled {
                    background: rgba(245, 158, 11, 0.1);
                    color: var(--warning);
                }

                /* Retention Table */
                .retention-table {
                    background: var(--gray-50);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                }

                .retention-table h4 {
                    margin-top: 0;
                    color: var(--gray-900);
                    margin-bottom: 1rem;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th {
                    text-align: left;
                    padding: 0.75rem;
                    border-bottom: 2px solid var(--gray-200);
                    color: var(--gray-700);
                    font-weight: 600;
                }

                td {
                    padding: 0.75rem;
                    border-bottom: 1px solid var(--gray-200);
                    color: var(--gray-600);
                }

                tr:last-child td {
                    border-bottom: none;
                }

                .retention-period {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: white;
                    border: 1px solid var(--gray-300);
                    border-radius: 6px;
                    font-size: 0.85rem;
                }

                /* Rights Grid */
                .rights-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .right-card {
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: 12px;
                    padding: 1.5rem;
                    text-align: center;
                }

                .right-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .right-icon {
                    font-size: 1.5rem;
                    color: var(--primary);
                }

                .right-card h4 {
                    margin: 0;
                    color: var(--gray-900);
                }

                .right-card p {
                    color: var(--gray-600);
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                    min-height: 60px;
                }

                .right-action-btn {
                    padding: 0.75rem 1.5rem;
                    background: var(--gray-100);
                    color: var(--gray-700);
                    border: 1px solid var(--gray-300);
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                }

                .right-action-btn:hover {
                    background: var(--gray-200);
                    transform: translateY(-1px);
                }

                /* Contacts Grid */
                .contacts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .contact-card {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02));
                    border: 1px solid rgba(59, 130, 246, 0.15);
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .contact-card h4 {
                    margin-top: 0;
                    color: var(--gray-900);
                    margin-bottom: 1rem;
                }

                .contact-detail {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                    color: var(--gray-700);
                }

                .contact-detail a {
                    color: var(--secondary);
                    text-decoration: none;
                }

                .contact-detail a:hover {
                    text-decoration: underline;
                }

                .contact-description {
                    margin: 1rem 0 0;
                    color: var(--gray-600);
                    font-size: 0.9rem;
                }

                /* Quick Action Bar */
                .quick-action-bar {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                    flex-wrap: wrap;
                }

                .quick-action {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--gray-100);
                    border: 1px solid var(--gray-300);
                    border-radius: 8px;
                    color: var(--gray-700);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .quick-action:hover {
                    background: var(--gray-200);
                    transform: translateY(-1px);
                }

                .quick-action.danger {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--danger);
                    border-color: rgba(239, 68, 68, 0.2);
                }

                .quick-action.danger:hover {
                    background: rgba(239, 68, 68, 0.2);
                }

                /* Footer */
                .privacy-footer {
                    background: var(--gray-900);
                    color: white;
                    border-radius: 16px;
                    padding: 2rem;
                    margin-top: 3rem;
                }

                .footer-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .footer-left h4 {
                    margin: 0 0 0.5rem;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .footer-left p {
                    margin: 0.25rem 0;
                    color: var(--gray-300);
                }

                .contact-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--primary-light);
                    text-decoration: none;
                    font-weight: 500;
                    margin-top: 0.5rem;
                }

                .contact-link:hover {
                    text-decoration: underline;
                }

                .compliance-badges {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .compliance-badge {
                    padding: 0.5rem 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .document-id {
                    font-family: 'Courier New', monospace;
                    color: var(--gray-400);
                    margin: 0;
                    font-size: 0.9rem;
                }

                /* Floating Actions */
                .floating-actions {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    z-index: 100;
                }

                .floating-btn {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    background: white;
                    color: var(--gray-700);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transition: all 0.3s;
                }

                .floating-btn:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
                }

                .floating-btn.primary {
                    background: var(--primary);
                    color: white;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .privacy-container {
                        padding: 1rem;
                    }

                    .privacy-header {
                        flex-direction: column;
                        text-align: center;
                        padding: 1.5rem;
                        gap: 1.5rem;
                    }

                    .header-main {
                        flex-direction: column;
                    }

                    .header-main h1 {
                        font-size: 1.6rem;
                    }

                    .header-actions {
                        justify-content: center;
                    }

                    .action-btn span {
                        display: none;
                    }

                    .privacy-dashboard {
                        padding: 1.5rem;
                    }

                    .controls-grid {
                        grid-template-columns: 1fr;
                    }

                    .section-header {
                        padding: 1.25rem;
                    }

                    .section-header h2 {
                        font-size: 1.1rem;
                    }

                    .section-content {
                        padding: 0 1.25rem 1.25rem;
                    }

                    .data-types-grid,
                    .purposes-grid,
                    .security-grid,
                    .rights-grid,
                    .contacts-grid {
                        grid-template-columns: 1fr;
                    }

                    .quick-action-bar {
                        flex-direction: column;
                    }

                    .footer-content {
                        flex-direction: column;
                        text-align: center;
                    }

                    .floating-actions {
                        bottom: 1rem;
                        right: 1rem;
                    }

                    .floating-btn {
                        width: 48px;
                        height: 48px;
                        font-size: 1rem;
                    }
                }

                @media (max-width: 480px) {
                    .header-details {
                        flex-direction: column;
                        align-items: center;
                    }

                    .policy-section {
                        margin-bottom: 0.75rem;
                    }

                    .compliance-badges {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default PrivacyPolicy;