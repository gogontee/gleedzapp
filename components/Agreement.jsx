'use client';

import React, { useState } from 'react';
import { 
    FaScroll, FaUserShield, FaUserCheck, FaExclamationTriangle, 
    FaBalanceScale, FaGavel, FaHandshake, FaLock, FaEye, 
    FaTrash, FaEdit, FaBan, FaUserTimes, FaCommentDots, 
    FaQuestionCircle, FaChevronDown, FaChevronUp, FaCopy,
    FaBookmark, FaDownload, FaPrint, FaShareAlt, FaCheck,
    FaRegBookmark, FaRegCopy, FaFileContract
} from 'react-icons/fa';

const Agreement = () => {
    const [expandedSections, setExpandedSections] = useState(['overview']);
    const [copiedSections, setCopiedSections] = useState([]);

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const copyToClipboard = (text, sectionId) => {
        navigator.clipboard.writeText(text);
        setCopiedSections(prev => [...prev, sectionId]);
        setTimeout(() => {
            setCopiedSections(prev => prev.filter(id => id !== sectionId));
        }, 2000);
    };

    const sections = [
        {
            id: 'overview',
            icon: <FaScroll />,
            title: 'Agreement Overview',
            content: [
                "This User Agreement ('Agreement') is a legally binding contract between you ('User') and Gleedz Technologies ('Gleedz', 'we', 'us', or 'our').",
                "It outlines the rights, responsibilities, and obligations when using the Gleedz platform.",
                "This Agreement supplements our Terms of Service and Privacy Policy. In case of conflict, the Terms of Service shall prevail."
            ]
        },
        {
            id: 'user-categories',
            icon: <FaUserShield />,
            title: 'User Categories & Account Rights',
            subsections: [
                {
                    title: 'Event Producer Rights',
                    icon: <FaUserCheck />,
                    items: [
                        'Create and manage up to 5 concurrent events',
                        'Set ticket prices, registration fees, and voting costs',
                        'Withdraw earned tokens to linked bank accounts',
                        'Moderate event participants and content',
                        'View detailed event performance metrics'
                    ]
                },
                {
                    title: 'Participant Rights',
                    icon: <FaUserCheck />,
                    items: [
                        'Enter eligible events as contestant or attendee',
                        'Vote in contests using tokens',
                        'Register for paid and free events',
                        'Create and customize public profile',
                        'Fund wallet and use tokens for platform services'
                    ]
                },
                {
                    title: 'Anonymous User Rights',
                    icon: <FaEye />,
                    items: [
                        'View public events and participant profiles',
                        'Vote in events allowing anonymous participation',
                        'Access public event information',
                        'Access limited features without registration',
                        'Rights limited to single browser session'
                    ]
                }
            ],
            highlights: [
                'Users are solely responsible for maintaining password confidentiality',
                'All activities under your account are your responsibility',
                'Immediately notify Gleedz of unauthorized account use',
                'Users must be at least 18 years old (or age of majority in jurisdiction)',
                'Users may maintain only one account per category'
            ]
        },
        {
            id: 'content-rights',
            icon: <FaEdit />,
            title: 'Content Rights & Responsibilities',
            subsections: [
                {
                    title: 'User-Generated Content',
                    items: [
                        'Users retain ownership of content they create',
                        'Grant Gleedz worldwide license to host and distribute',
                        'Event content may be used for Gleedz marketing',
                        'Content may be modified for technical compatibility',
                        'Gleedz may sub-license to service providers'
                    ]
                },
                {
                    title: 'Prohibited Content',
                    icon: <FaExclamationTriangle />,
                    items: [
                        'Content violating laws or promoting illegal activities',
                        'Material infringing intellectual property rights',
                        'Hate speech, harassment, or threats',
                        'Pornographic, obscene, or sexually explicit material',
                        'Content promoting violence or dangerous activities',
                        'Viruses, malware, or harmful code'
                    ]
                }
            ]
        },
        {
            id: 'token-financial',
            icon: <FaBalanceScale />,
            title: 'Token & Financial Agreement',
            subsections: [
                {
                    title: 'Token Ownership',
                    icon: <FaLock />,
                    items: [
                        'Tokens are digital assets with no cash value outside Gleedz',
                        'Purchased tokens are non-refundable except as required by law',
                        'Tokens expire after 24 months of account inactivity',
                        'Gleedz may adjust token value with 7-day notice',
                        'Tokens cannot be transferred between user accounts'
                    ]
                },
                {
                    title: 'Withdrawal Restrictions',
                    icon: <FaUserTimes />,
                    items: [
                        'Event Producers may withdraw to verified bank accounts',
                        'Participants have no withdrawal rights',
                        'Minimum withdrawal: 1000 tokens for Event Producers',
                        'Processing time: 5-10 business days'
                    ]
                },
                {
                    title: 'Payment Processing',
                    items: [
                        'Payments processed by certified third-party partners',
                        'Currency conversion rates determined at time of transaction',
                        'Users can access 24-month transaction history',
                        'Unauthorized chargebacks result in account suspension',
                        'Users responsible for applicable taxes'
                    ]
                }
            ]
        },
        {
            id: 'dispute-resolution',
            icon: <FaGavel />,
            title: 'Dispute Resolution & Moderation',
            subsections: [
                {
                    title: 'Dispute Process',
                    steps: [
                        'Users must attempt to resolve disputes directly',
                        'Gleedz may mediate if unresolved',
                        'Unresolved disputes go to binding arbitration in Lagos, Nigeria'
                    ]
                },
                {
                    title: 'Platform Moderation Rights',
                    items: [
                        'Gleedz may review any content for policy compliance',
                        'May suspend accounts for policy violations',
                        'May assume control of events violating laws',
                        'May intervene in disputes affecting platform integrity'
                    ]
                }
            ]
        },
        {
            id: 'final-provisions',
            icon: <FaHandshake />,
            title: 'Final Provisions',
            items: [
                'Users consent to electronic communications from Gleedz',
                'May opt out of marketing emails but not service announcements',
                'For questions, contact legal@gleedz.com (5 business days response)',
                'Account data retained for 5 years after termination',
                'Anonymized data may be kept for analytics'
            ],
            acceptance: [
                'You have read and understood this User Agreement',
                'You agree to be bound by its terms and conditions',
                'You are legally capable of entering into this Agreement',
                'You consent to electronic communications and records'
            ]
        }
    ];

    const handleDownloadPDF = () => {
        // In production, this would generate/request a PDF
        alert('PDF download would be initiated in production');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Gleedz User Agreement',
                    text: 'Read the Gleedz User Agreement',
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        }
    };

    return (
        <div className="agreement-container">
            {/* Header */}
            <div className="agreement-header">
                <div className="header-content">
                    <FaFileContract className="header-icon" />
                    <div>
                        <h1>Gleedz User Agreement</h1>
                        <p className="subtitle">Last Updated: June 1, 2024 • Effective Immediately</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={handleDownloadPDF} className="action-btn" title="Download PDF">
                        <FaDownload />
                        <span>PDF</span>
                    </button>
                    <button onClick={handlePrint} className="action-btn" title="Print">
                        <FaPrint />
                        <span>Print</span>
                    </button>
                    <button onClick={handleShare} className="action-btn" title="Share">
                        <FaShareAlt />
                        <span>Share</span>
                    </button>
                    <button className="action-btn bookmark" title="Bookmark">
                        <FaRegBookmark />
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Quick Navigation */}
            <div className="quick-nav">
                {sections.map((section, index) => (
                    <button
                        key={section.id}
                        onClick={() => {
                            document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                            toggleSection(section.id);
                        }}
                        className={`nav-item ${expandedSections.includes(section.id) ? 'active' : ''}`}
                    >
                        <span className="nav-number">{index + 1}</span>
                        <span className="nav-icon">{section.icon}</span>
                        <span className="nav-label">{section.title.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            {/* Agreement Content */}
            <div className="agreement-content">
                {sections.map((section) => (
                    <section 
                        key={section.id} 
                        id={section.id}
                        className={`agreement-section ${expandedSections.includes(section.id) ? 'expanded' : 'collapsed'}`}
                    >
                        <div className="section-header" onClick={() => toggleSection(section.id)}>
                            <div className="section-title">
                                <span className="section-icon">{section.icon}</span>
                                <h2>{section.title}</h2>
                            </div>
                            <button className="expand-btn">
                                {expandedSections.includes(section.id) ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>

                        {expandedSections.includes(section.id) && (
                            <div className="section-content">
                                {/* Copy Button */}
                                <button 
                                    onClick={() => copyToClipboard(section.title + '\n' + JSON.stringify(section.content || section.items), section.id)}
                                    className="copy-btn"
                                >
                                    {copiedSections.includes(section.id) ? <FaCheck /> : <FaRegCopy />}
                                    <span>{copiedSections.includes(section.id) ? 'Copied!' : 'Copy'}</span>
                                </button>

                                {/* Content based on section type */}
                                {section.content && (
                                    <div className="content-card">
                                        {section.content.map((text, idx) => (
                                            <p key={idx}>{text}</p>
                                        ))}
                                    </div>
                                )}

                                {section.subsections && (
                                    <div className="subsection-grid">
                                        {section.subsections.map((subsection, idx) => (
                                            <div key={idx} className="subsection-card">
                                                <div className="subsection-header">
                                                    {subsection.icon && <span className="subsection-icon">{subsection.icon}</span>}
                                                    <h4>{subsection.title}</h4>
                                                </div>
                                                {subsection.items && (
                                                    <ul>
                                                        {subsection.items.map((item, itemIdx) => (
                                                            <li key={itemIdx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {subsection.steps && (
                                                    <div className="step-list">
                                                        {subsection.steps.map((step, stepIdx) => (
                                                            <div key={stepIdx} className="step-item">
                                                                <span className="step-number">{stepIdx + 1}</span>
                                                                <span className="step-text">{step}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {section.highlights && (
                                    <div className="highlight-box">
                                        <h4>Important Notes</h4>
                                        <ul>
                                            {section.highlights.map((highlight, idx) => (
                                                <li key={idx}>
                                                    <FaExclamationTriangle className="warning-icon" />
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {section.items && !section.subsections && (
                                    <div className="content-list">
                                        <ul>
                                            {section.items.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {section.id === 'final-provisions' && section.acceptance && (
                                    <div className="acceptance-card">
                                        <div className="acceptance-header">
                                            <FaHandshake className="acceptance-icon" />
                                            <h3>Agreement Acceptance</h3>
                                        </div>
                                        <p>By using Gleedz services, you acknowledge that:</p>
                                        <ol>
                                            {section.acceptance.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ol>
                                        <div className="signature-line">
                                            <span className="signature-label">Effective upon first use of Gleedz services</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                ))}

                {/* Floating Action Buttons */}
                <div className="floating-actions">
                    <button className="floating-btn primary" onClick={handleDownloadPDF}>
                        <FaDownload />
                    </button>
                    <button className="floating-btn" onClick={handlePrint}>
                        <FaPrint />
                    </button>
                    <button className="floating-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        ↑
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="agreement-footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <h4>Need Help?</h4>
                        <p>Contact our legal team at <strong>legal@gleedz.com</strong></p>
                        <p className="response-time">Response within 5 business days</p>
                    </div>
                    <div className="footer-right">
                        <p className="agreement-id">Document ID: UA-2024-001</p>
                        <p className="version">Version 2.1</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                :root {
                    --primary: #F59E0B;
                    --primary-dark: #D97706;
                    --primary-light: #FBBF24;
                    --secondary: #3B82F6;
                    --danger: #EF4444;
                    --success: #10B981;
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

                .agreement-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    min-height: 100vh;
                }

                /* Header */
                .agreement-header {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--gray-200);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-icon {
                    font-size: 2.5rem;
                    color: var(--primary);
                }

                .header-content h1 {
                    margin: 0;
                    color: var(--gray-900);
                    font-size: 1.8rem;
                }

                .subtitle {
                    color: var(--gray-600);
                    font-size: 0.9rem;
                    margin-top: 0.25rem;
                }

                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: var(--gray-100);
                    border: 1px solid var(--gray-200);
                    border-radius: 8px;
                    color: var(--gray-700);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: var(--gray-200);
                    transform: translateY(-1px);
                }

                .action-btn.bookmark {
                    background: rgba(245, 158, 11, 0.1);
                    color: var(--primary);
                    border-color: rgba(245, 158, 11, 0.2);
                }

                /* Quick Navigation */
                .quick-nav {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
                }

                .nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.5rem;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 80px;
                }

                .nav-item:hover {
                    background: var(--gray-50);
                }

                .nav-item.active {
                    background: rgba(245, 158, 11, 0.1);
                    color: var(--primary);
                }

                .nav-number {
                    width: 24px;
                    height: 24px;
                    background: var(--gray-200);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .nav-item.active .nav-number {
                    background: var(--primary);
                    color: white;
                }

                .nav-icon {
                    font-size: 1.2rem;
                }

                .nav-label {
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                /* Agreement Sections */
                .agreement-section {
                    background: white;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
                    transition: all 0.3s ease;
                }

                .agreement-section.expanded {
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
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
                    position: relative;
                }

                .copy-btn {
                    position: absolute;
                    top: -0.5rem;
                    right: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: var(--gray-100);
                    border: 1px solid var(--gray-200);
                    border-radius: 6px;
                    font-size: 0.85rem;
                    color: var(--gray-600);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .copy-btn:hover {
                    background: var(--gray-200);
                }

                /* Content Cards */
                .content-card {
                    background: var(--gray-50);
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin: 1.5rem 0;
                    border-left: 4px solid var(--primary);
                }

                .content-card p {
                    color: var(--gray-700);
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }

                .content-card p:last-child {
                    margin-bottom: 0;
                }

                /* Subsection Grid */
                .subsection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .subsection-card {
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: 10px;
                    padding: 1.5rem;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .subsection-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
                }

                .subsection-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid var(--gray-100);
                }

                .subsection-icon {
                    font-size: 1.2rem;
                    color: var(--primary);
                }

                .subsection-card h4 {
                    margin: 0;
                    color: var(--gray-900);
                    font-size: 1.1rem;
                }

                .subsection-card ul {
                    margin: 0;
                    padding-left: 1.5rem;
                }

                .subsection-card li {
                    color: var(--gray-700);
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }

                /* Step List */
                .step-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .step-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .step-number {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    background: var(--primary);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                }

                .step-text {
                    color: var(--gray-700);
                    line-height: 1.6;
                    padding-top: 0.5rem;
                }

                /* Highlight Box */
                .highlight-box {
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02));
                    border: 1px solid rgba(245, 158, 11, 0.15);
                    border-radius: 10px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                }

                .highlight-box h4 {
                    color: var(--gray-900);
                    margin-top: 0;
                    margin-bottom: 1rem;
                }

                .highlight-box ul {
                    margin: 0;
                    padding: 0;
                }

                .highlight-box li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                    color: var(--gray-700);
                }

                .warning-icon {
                    color: var(--warning);
                    flex-shrink: 0;
                    margin-top: 0.2rem;
                }

                /* Content List */
                .content-list {
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: 10px;
                    padding: 1.5rem;
                    margin: 1.5rem 0;
                }

                .content-list ul {
                    margin: 0;
                    padding-left: 1.5rem;
                }

                .content-list li {
                    color: var(--gray-700);
                    margin-bottom: 0.75rem;
                    line-height: 1.6;
                }

                /* Acceptance Card */
                .acceptance-card {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02));
                    border: 2px solid var(--success);
                    border-radius: 12px;
                    padding: 2rem;
                    margin: 2rem 0;
                    text-align: center;
                }

                .acceptance-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .acceptance-icon {
                    font-size: 2rem;
                    color: var(--success);
                }

                .acceptance-card h3 {
                    margin: 0;
                    color: var(--gray-900);
                    font-size: 1.4rem;
                }

                .acceptance-card p {
                    color: var(--gray-700);
                    margin-bottom: 1.5rem;
                }

                .acceptance-card ol {
                    text-align: left;
                    margin: 0 auto 2rem;
                    max-width: 600px;
                    padding-left: 1.5rem;
                }

                .acceptance-card li {
                    color: var(--gray-700);
                    margin-bottom: 1rem;
                    line-height: 1.6;
                }

                .signature-line {
                    padding-top: 1.5rem;
                    border-top: 2px solid var(--gray-200);
                }

                .signature-label {
                    color: var(--gray-600);
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

                /* Footer */
                .agreement-footer {
                    background: var(--gray-900);
                    color: white;
                    border-radius: 12px;
                    padding: 2rem;
                    margin-top: 3rem;
                }

                .footer-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .footer-left h4 {
                    margin: 0 0 0.5rem;
                    color: white;
                }

                .footer-left p {
                    margin: 0.25rem 0;
                    color: var(--gray-300);
                }

                .response-time {
                    font-size: 0.9rem;
                    color: var(--gray-400);
                }

                .footer-right {
                    text-align: right;
                }

                .agreement-id {
                    font-family: 'Courier New', monospace;
                    color: var(--gray-400);
                    margin: 0;
                }

                .version {
                    color: var(--gray-300);
                    font-size: 0.9rem;
                    margin: 0.25rem 0 0;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .agreement-container {
                        padding: 1rem 0.5rem;
                    }

                    .agreement-header {
                        flex-direction: column;
                        gap: 1.5rem;
                        text-align: center;
                        padding: 1.5rem;
                    }

                    .header-content {
                        flex-direction: column;
                    }

                    .header-actions {
                        flex-wrap: wrap;
                        justify-content: center;
                    }

                    .action-btn span {
                        display: none;
                    }

                    .quick-nav {
                        overflow-x: auto;
                        justify-content: flex-start;
                        padding: 0.75rem;
                    }

                    .nav-item {
                        padding: 0.75rem 1rem;
                        min-width: 70px;
                    }

                    .nav-label {
                        display: none;
                    }

                    .section-header {
                        padding: 1.25rem;
                    }

                    .section-content {
                        padding: 0 1.25rem 1.25rem;
                    }

                    .subsection-grid {
                        grid-template-columns: 1fr;
                    }

                    .footer-content {
                        flex-direction: column;
                        gap: 1.5rem;
                        text-align: center;
                    }

                    .footer-right {
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
                    .agreement-header h1 {
                        font-size: 1.5rem;
                    }

                    .section-header h2 {
                        font-size: 1.1rem;
                    }

                    .subsection-card {
                        padding: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Agreement;