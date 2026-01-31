'use client';

import React, { useState, useEffect } from 'react';
import { 
    FaFileContract, FaUsers, FaCoins, FaCalendarPlus, FaVoteYea, 
    FaUserCheck, FaCreditCard, FaBalanceScale, FaExclamationCircle, 
    FaExchangeAlt, FaWallet, FaMoneyBillWave, FaHandHoldingUsd,
    FaInfoCircle, FaShieldAlt, FaGavel, FaFileAlt
} from 'react-icons/fa';

const Terms = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <FaFileContract /> },
        { id: 'accounts', label: 'Accounts', icon: <FaUsers /> },
        { id: 'tokens', label: 'Tokens', icon: <FaCoins /> },
        { id: 'events', label: 'Events', icon: <FaCalendarPlus /> },
        { id: 'voting', label: 'Voting', icon: <FaVoteYea /> },
        { id: 'conduct', label: 'Conduct', icon: <FaUserCheck /> },
        { id: 'fees', label: 'Fees', icon: <FaCreditCard /> },
        { id: 'liability', label: 'Liability', icon: <FaBalanceScale /> },
        { id: 'changes', label: 'Changes', icon: <FaExclamationCircle /> }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaFileContract className="content-icon" /> Terms of Service</h2>
                            <p className="last-updated">Last Updated: June 1, 2024</p>
                        </div>
                        
                        <div className="content-card">
                            <h3>Welcome to Gleedz</h3>
                            <p>Welcome to Gleedz, the premium multi-event platform where organizers can create, manage, and monetize their events. By accessing or using Gleedz, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                            <p>Gleedz is a hub for premium events where organizers can create event websites with comprehensive functionality including ticket customization, registration management, voting systems, award hosting, and more.</p>
                        </div>

                        <div className="quick-links">
                            <h4>Quick Navigation</h4>
                            <div className="links-grid">
                                <button onClick={() => setActiveTab('accounts')} className="link-card">
                                    <FaUsers className="link-icon" />
                                    <span>Account Types</span>
                                </button>
                                <button onClick={() => setActiveTab('tokens')} className="link-card">
                                    <FaCoins className="link-icon" />
                                    <span>Token System</span>
                                </button>
                                <button onClick={() => setActiveTab('events')} className="link-card">
                                    <FaCalendarPlus className="link-icon" />
                                    <span>Event Creation</span>
                                </button>
                                <button onClick={() => setActiveTab('fees')} className="link-card">
                                    <FaCreditCard className="link-icon" />
                                    <span>Fees & Payments</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'accounts':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaUsers className="content-icon" /> Account Types & Responsibilities</h2>
                            <p className="section-description">Different account types with specific functionalities</p>
                        </div>

                        <div className="account-cards">
                            <div className="account-card producer">
                                <div className="account-header">
                                    <div className="account-icon">
                                        <FaFileAlt />
                                    </div>
                                    <h3>Event Producer</h3>
                                    <span className="account-badge">Premium</span>
                                </div>
                                <ul>
                                    <li>Create up to 5 events simultaneously</li>
                                    <li>Yearly subscription fee required</li>
                                    <li>Full event management tools access</li>
                                    <li>Customize tickets & voting systems</li>
                                    <li><strong>Token withdrawals permitted</strong></li>
                                </ul>
                            </div>

                            <div className="account-card participant">
                                <div className="account-header">
                                    <div className="account-icon">
                                        <FaUserCheck />
                                    </div>
                                    <h3>Participant</h3>
                                    <span className="account-badge">Standard</span>
                                </div>
                                <ul>
                                    <li>Enter events as contestant or attendee</li>
                                    <li><strong>Only account owners can register as candidates</strong></li>
                                    <li>Vote for favorites using tokens</li>
                                    <li>Fund token wallet for platform activities</li>
                                    <li><strong>No token withdrawals</strong></li>
                                </ul>
                            </div>

                            <div className="account-card anonymous">
                                <div className="account-header">
                                    <div className="account-icon">
                                        <FaShieldAlt />
                                    </div>
                                    <h3>Anonymous User</h3>
                                    <span className="account-badge">Limited</span>
                                </div>
                                <ul>
                                    <li>Vote without creating account</li>
                                    <li>Limited to voting functionality only</li>
                                    <li>Cannot create events</li>
                                    <li>Cannot participate as candidate</li>
                                    <li>No premium features access</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'tokens':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaCoins className="content-icon" /> Token System & Financial Terms</h2>
                            <p className="section-description">Exclusive currency for all platform transactions</p>
                        </div>

                        <div className="token-grid">
                            <div className="token-card">
                                <div className="token-card-header">
                                    <FaExchangeAlt className="token-icon" />
                                    <h3>Token Value</h3>
                                </div>
                                <div className="token-values">
                                    <div className="value-item">
                                        <span className="currency">₦</span>
                                        <div>
                                            <p className="amount">1 Token = 1000 NGN</p>
                                            <p className="label">Nigerian Naira</p>
                                        </div>
                                    </div>
                                    <div className="value-item">
                                        <span className="currency">$</span>
                                        <div>
                                            <p className="amount">1 Token = 1 USD</p>
                                            <p className="label">US Dollar</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="notice">
                                    <FaInfoCircle /> 7 days notice for any price changes
                                </div>
                            </div>

                            <div className="token-card">
                                <div className="token-card-header">
                                    <FaWallet className="token-icon" />
                                    <h3>Token Usage</h3>
                                </div>
                                <ul>
                                    <li>Creating events (min 50 tokens)</li>
                                    <li>Voting in contests</li>
                                    <li>Event registration</li>
                                    <li>Ticket purchases</li>
                                    <li>Gifting participants</li>
                                </ul>
                                <div className="important-note">
                                    <FaInfoCircle /> Fans can fund any amount of tokens for platform use only
                                </div>
                            </div>

                            <div className="token-card">
                                <div className="token-card-header">
                                    <FaMoneyBillWave className="token-icon" />
                                    <h3>Minimum Requirements</h3>
                                </div>
                                <div className="min-requirement">
                                    <span className="min-amount">50</span>
                                    <div>
                                        <p className="min-label">Tokens Required</p>
                                        <p className="min-desc">To create events on Gleedz</p>
                                    </div>
                                </div>
                                <p>Minimum balance requirements apply for various platform transactions.</p>
                            </div>

                            <div className="token-card">
                                <div className="token-card-header">
                                    <FaHandHoldingUsd className="token-icon" />
                                    <h3>Withdrawals</h3>
                                </div>
                                <div className="withdrawal-info">
                                    <div className="withdrawal-item allowed">
                                        <h4>Event Producers</h4>
                                        <p>Can withdraw to verified accounts</p>
                                    </div>
                                    <div className="withdrawal-item not-allowed">
                                        <h4>Participants</h4>
                                        <p>No withdrawal rights</p>
                                    </div>
                                </div>
                                <p className="refund-note">All token purchases are final and non-refundable.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'events':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaCalendarPlus className="content-icon" /> Event Creation & Management</h2>
                            <p className="section-description">Create and manage premium events on Gleedz</p>
                        </div>

                        <div className="event-types">
                            <h3>Supported Event Types</h3>
                            <div className="event-tags">
                                <span className="event-tag">Pageantry</span>
                                <span className="event-tag">Reality Shows</span>
                                <span className="event-tag">Music Events</span>
                                <span className="event-tag">Sports Events</span>
                                <span className="event-tag">Faith-based Events</span>
                                <span className="event-tag">Awards</span>
                                <span className="event-tag">Contests</span>
                                <span className="event-tag">Conferences</span>
                            </div>
                        </div>

                        <div className="features-grid">
                            <div className="feature-card">
                                <h4>Ticket Customization</h4>
                                <p>Both paid and free ticket options with customizable parameters to match your event needs.</p>
                            </div>
                            <div className="feature-card">
                                <h4>Registration Systems</h4>
                                <p>Tailored registration forms for different event types and participant categories.</p>
                            </div>
                            <div className="feature-card">
                                <h4>Voting Systems</h4>
                                <p>Customizable voting mechanisms for contests, competitions, and audience choices.</p>
                            </div>
                            <div className="feature-card">
                                <h4>Event Limits</h4>
                                <p>Maximum of 5 concurrent events per Event Producer account to ensure quality.</p>
                            </div>
                        </div>

                        <div className="responsibility-note">
                            <FaGavel className="note-icon" />
                            <div>
                                <h4>Producer Responsibility</h4>
                                <p>Event Producers are solely responsible for the content, legality, and management of their events. Gleedz acts as a platform provider and is not responsible for event outcomes or disputes.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'voting':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaVoteYea className="content-icon" /> Voting System</h2>
                            <p className="section-description">Flexible voting options for all events</p>
                        </div>

                        <div className="voting-options">
                            <div className="voting-card authenticated">
                                <div className="voting-header">
                                    <div className="voting-icon">
                                        <FaUserCheck />
                                    </div>
                                    <h3>Authenticated Voting</h3>
                                </div>
                                <ul>
                                    <li>Registered users only</li>
                                    <li>Uses tokens from wallet</li>
                                    <li>Full voting history</li>
                                    <li>Participant rewards eligible</li>
                                </ul>
                            </div>

                            <div className="voting-card anonymous">
                                <div className="voting-header">
                                    <div className="voting-icon">
                                        <FaShieldAlt />
                                    </div>
                                    <h3>Anonymous Voting</h3>
                                </div>
                                <ul>
                                    <li>No account required</li>
                                    <li>Limited voting access</li>
                                    <li>Session-based only</li>
                                    <li>No voting history</li>
                                </ul>
                            </div>
                        </div>

                        <div className="voting-integrity">
                            <h4>Vote Integrity</h4>
                            <p>Gleedz reserves the right to audit voting patterns if legally required to ensure fair and transparent voting processes.</p>
                            <div className="integrity-features">
                                <span className="integrity-tag">Pattern Analysis</span>
                                <span className="integrity-tag">Fraud Detection</span>
                                <span className="integrity-tag">Audit Trails</span>
                                <span className="integrity-tag">Fair Play</span>
                            </div>
                        </div>
                    </div>
                );

            case 'conduct':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaUserCheck className="content-icon" /> User Conduct & Prohibited Activities</h2>
                            <p className="section-description">Rules for maintaining platform integrity</p>
                        </div>

                        <div className="prohibited-list">
                            <h3>Prohibited Activities</h3>
                            <div className="prohibited-items">
                                <div className="prohibited-item">
                                    <div className="prohibited-icon">🚫</div>
                                    <div>
                                        <h4>Fraudulent Events</h4>
                                        <p>Creating fake events or misrepresenting event details</p>
                                    </div>
                                </div>
                                <div className="prohibited-item">
                                    <div className="prohibited-icon">🚫</div>
                                    <div>
                                        <h4>Vote Manipulation</h4>
                                        <p>Manipulating voting systems or engaging in vote fraud</p>
                                    </div>
                                </div>
                                <div className="prohibited-item">
                                    <div className="prohibited-icon">🚫</div>
                                    <div>
                                        <h4>Harassment</h4>
                                        <p>Harassing other users or participants</p>
                                    </div>
                                </div>
                                <div className="prohibited-item">
                                    <div className="prohibited-icon">🚫</div>
                                    <div>
                                        <h4>Illegal Activities</h4>
                                        <p>Using platform for illegal events or activities</p>
                                    </div>
                                </div>
                                <div className="prohibited-item">
                                    <div className="prohibited-icon">🚫</div>
                                    <div>
                                        <h4>Security Threats</h4>
                                        <p>Uploading malicious content or compromising security</p>
                                    </div>
                                </div>
                                <div className="prohibited-item">
                                    <div className="prohibited-icon">🚫</div>
                                    <div>
                                        <h4>Unauthorized Access</h4>
                                        <p>Sharing account access or unauthorized use</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="consequences">
                            <h4>Violation Consequences</h4>
                            <p>Violation of these conduct rules may result in account suspension or termination without refund. Repeated violations may lead to permanent platform ban.</p>
                        </div>
                    </div>
                );

            case 'fees':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaCreditCard className="content-icon" /> Fees, Payments & Refunds</h2>
                            <p className="section-description">Financial terms and conditions</p>
                        </div>

                        <div className="fees-grid">
                            <div className="fee-card">
                                <h3>Event Producer Fee</h3>
                                <p className="fee-amount">Yearly Subscription</p>
                                <p className="fee-desc">Required for Event Producer accounts to access premium features</p>
                            </div>

                            <div className="fee-card highlight">
                                <h3>Platform Commission</h3>
                                <p className="fee-amount">10% of Revenue</p>
                                <p className="fee-desc">Gleedz retains 10% of total event revenue</p>
                            </div>

                            <div className="fee-card">
                                <h3>Payment Processing</h3>
                                <p className="fee-amount">Third-Party Fees</p>
                                <p className="fee-desc">Additional fees may apply from payment processors</p>
                            </div>
                        </div>

                        <div className="refund-policy">
                            <h4>Refund Policy</h4>
                            <div className="refund-items">
                                <div className="refund-item">
                                    <h5>Token Purchases</h5>
                                    <p>Generally non-refundable except where required by law</p>
                                </div>
                                <div className="refund-item">
                                    <h5>Event Refunds</h5>
                                    <p>At the discretion of Event Producers based on their event policies</p>
                                </div>
                            </div>
                        </div>

                        <div className="fee-notice">
                            <FaExclamationCircle className="notice-icon" />
                            <p>All fees are subject to change with 7 days notice. Users are responsible for any taxes applicable to their transactions.</p>
                        </div>
                    </div>
                );

            case 'liability':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaBalanceScale className="content-icon" /> Liability & Dispute Resolution</h2>
                            <p className="section-description">Platform responsibilities and user protections</p>
                        </div>

                        <div className="liability-list">
                            <h3>Gleedz is Not Responsible For:</h3>
                            <div className="liability-items">
                                <div className="liability-item">
                                    <div className="liability-icon">⚖️</div>
                                    <div>
                                        <h4>Event Outcomes</h4>
                                        <p>Disputes between participants and organizers</p>
                                    </div>
                                </div>
                                <div className="liability-item">
                                    <div className="liability-icon">💸</div>
                                    <div>
                                        <h4>Financial Losses</h4>
                                        <p>Losses from event participation or token investments</p>
                                    </div>
                                </div>
                                <div className="liability-item">
                                    <div className="liability-icon">🔧</div>
                                    <div>
                                        <h4>Technical Issues</h4>
                                        <p>Issues beyond our reasonable control</p>
                                    </div>
                                </div>
                                <div className="liability-item">
                                    <div className="liability-icon">📝</div>
                                    <div>
                                        <h4>User Content</h4>
                                        <p>Content posted by users or event organizers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dispute-process">
                            <h4>Dispute Resolution Process</h4>
                            <div className="process-steps">
                                <div className="process-step">
                                    <span className="step-number">1</span>
                                    <div>
                                        <h5>Direct Resolution</h5>
                                        <p>Users attempt to resolve disputes directly</p>
                                    </div>
                                </div>
                                <div className="process-step">
                                    <span className="step-number">2</span>
                                    <div>
                                        <h5>Gleedz Mediation</h5>
                                        <p>Unresolved disputes may be escalated to Gleedz</p>
                                    </div>
                                </div>
                                <div className="process-step">
                                    <span className="step-number">3</span>
                                    <div>
                                        <h5>Binding Arbitration</h5>
                                        <p>Final resolution through binding arbitration</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'changes':
                return (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2><FaExclamationCircle className="content-icon" /> Changes to Terms</h2>
                            <p className="section-description">How we update our terms of service</p>
                        </div>

                        <div className="changes-info">
                            <div className="change-card">
                                <h3>Modification Rights</h3>
                                <p>Gleedz reserves the right to modify these Terms of Service at any time to reflect changes in our platform, services, or legal requirements.</p>
                            </div>

                            <div className="change-card">
                                <h3>Notice Period</h3>
                                <p>Major changes will be communicated via email or platform notifications with <strong>7 days notice</strong> before they take effect.</p>
                            </div>

                            <div className="change-card">
                                <h3>Acceptance</h3>
                                <p>Continued use of the platform after changes constitutes acceptance of the new terms. Users who disagree with changes may terminate their account.</p>
                            </div>
                        </div>

                        <div className="contact-support">
                            <h4>Questions & Support</h4>
                            <p>For questions about these terms or any concerns, please contact our support team:</p>
                            <div className="contact-info">
                                <a href="mailto:support@gleedz.com" className="contact-email">
                                    <FaFileContract className="contact-icon" />
                                    <span>support@gleedz.com</span>
                                </a>
                                <p className="response-time">Typically responds within 24-48 hours</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="terms-component">
            {/* Floating Tabs */}
            <div className={`floating-tabs ${isMobile ? 'mobile' : ''}`}>
                <div className="tabs-container">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="content-area">
                {renderContent()}
            </div>

            <style jsx>{`
                :root {
                    --yellow-500: #FBBF24;
                    --yellow-600: #D97706;
                    --yellow-700: #B45309;
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
                
                .terms-component {
                    display: flex;
                    gap: 2rem;
                    position: relative;
                    min-height: 600px;
                }
                
                /* Floating Tabs */
                .floating-tabs {
                    position: sticky;
                    top: 2rem;
                    width: 280px;
                    height: fit-content;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                    flex-shrink: 0;
                }
                
                .tabs-container {
                    display: flex;
                    flex-direction: column;
                    padding: 1rem;
                }
                
                .tab-button {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: transparent;
                    border: none;
                    border-radius: 10px;
                    color: var(--gray-600);
                    font-weight: 500;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }
                
                .tab-button:hover {
                    background: var(--gray-50);
                    color: var(--gray-800);
                }
                
                .tab-button.active {
                    background: rgba(251, 191, 36, 0.1);
                    color: var(--yellow-700);
                    font-weight: 600;
                }
                
                .tab-icon {
                    font-size: 1.1rem;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .tab-label {
                    flex: 1;
                }
                
                /* Content Area */
                .content-area {
                    flex: 1;
                    min-width: 0;
                }
                
                .tab-content {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
                    border: 1px solid var(--gray-200);
                }
                
                .content-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 2px solid var(--gray-200);
                }
                
                .content-header h2 {
                    font-size: 1.8rem;
                    color: var(--gray-900);
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 700;
                }
                
                .content-icon {
                    color: var(--yellow-500);
                    font-size: 1.5rem;
                }
                
                .last-updated {
                    color: var(--gray-500);
                    font-size: 0.9rem;
                }
                
                .section-description {
                    color: var(--gray-600);
                    font-size: 1rem;
                }
                
                /* Content Cards */
                .content-card {
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(251, 191, 36, 0.02));
                    padding: 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    border: 1px solid rgba(251, 191, 36, 0.15);
                }
                
                .content-card h3 {
                    color: var(--yellow-600);
                    margin-bottom: 1rem;
                    font-size: 1.3rem;
                }
                
                .content-card p {
                    color: var(--gray-700);
                    line-height: 1.7;
                    margin-bottom: 1rem;
                }
                
                .content-card p:last-child {
                    margin-bottom: 0;
                }
                
                /* Quick Links */
                .quick-links {
                    margin-top: 2rem;
                }
                
                .quick-links h4 {
                    font-size: 1.1rem;
                    color: var(--gray-800);
                    margin-bottom: 1rem;
                }
                
                .links-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                
                .link-card {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: var(--gray-50);
                    border: 1px solid var(--gray-200);
                    border-radius: 10px;
                    color: var(--gray-700);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .link-card:hover {
                    background: var(--gray-100);
                    border-color: var(--gray-300);
                    transform: translateY(-2px);
                }
                
                .link-icon {
                    font-size: 1.2rem;
                    color: var(--yellow-600);
                }
                
                /* Account Cards */
                .account-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }
                
                .account-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    border: 2px solid var(--gray-200);
                    transition: all 0.3s;
                }
                
                .account-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }
                
                .account-card.producer {
                    border-top: 4px solid var(--yellow-500);
                }
                
                .account-card.participant {
                    border-top: 4px solid #3B82F6;
                }
                
                .account-card.anonymous {
                    border-top: 4px solid var(--gray-400);
                }
                
                .account-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .account-icon {
                    width: 50px;
                    height: 50px;
                    background: var(--gray-100);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: var(--gray-700);
                }
                
                .account-card.producer .account-icon {
                    background: rgba(251, 191, 36, 0.1);
                    color: var(--yellow-600);
                }
                
                .account-card.participant .account-icon {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3B82F6;
                }
                
                .account-card.anonymous .account-icon {
                    background: rgba(156, 163, 175, 0.1);
                    color: var(--gray-500);
                }
                
                .account-header h3 {
                    font-size: 1.2rem;
                    color: var(--gray-900);
                    margin: 0;
                    flex: 1;
                }
                
                .account-badge {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-weight: 600;
                }
                
                .account-card.producer .account-badge {
                    background: rgba(251, 191, 36, 0.1);
                    color: var(--yellow-700);
                }
                
                .account-card.participant .account-badge {
                    background: rgba(59, 130, 246, 0.1);
                    color: #2563EB;
                }
                
                .account-card.anonymous .account-badge {
                    background: rgba(156, 163, 175, 0.1);
                    color: var(--gray-600);
                }
                
                .account-card ul {
                    margin: 0;
                    padding-left: 1.2rem;
                }
                
                .account-card li {
                    color: var(--gray-700);
                    margin-bottom: 0.8rem;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }
                
                /* Token Grid */
                .token-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }
                
                .token-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    border: 1px solid var(--gray-200);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
                }
                
                .token-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }
                
                .token-icon {
                    font-size: 1.5rem;
                    color: var(--yellow-600);
                }
                
                .token-card-header h3 {
                    font-size: 1.1rem;
                    color: var(--gray-900);
                    margin: 0;
                }
                
                .token-values {
                    margin-bottom: 1rem;
                }
                
                .value-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid var(--gray-100);
                }
                
                .value-item:last-child {
                    border-bottom: none;
                }
                
                .currency {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--yellow-600);
                }
                
                .amount {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--gray-900);
                    margin: 0;
                }
                
                .label {
                    font-size: 0.85rem;
                    color: var(--gray-500);
                    margin: 0;
                }
                
                .token-card ul {
                    margin: 0 0 1rem 1.2rem;
                    padding: 0;
                }
                
                .token-card li {
                    color: var(--gray-700);
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }
                
                .min-requirement {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .min-amount {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--yellow-500);
                }
                
                .min-label {
                    font-size: 0.9rem;
                    color: var(--gray-600);
                    margin: 0;
                }
                
                .min-desc {
                    font-size: 0.8rem;
                    color: var(--gray-500);
                    margin: 0.25rem 0 0;
                }
                
                .withdrawal-info {
                    margin-bottom: 1rem;
                }
                
                .withdrawal-item {
                    padding: 0.75rem;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                }
                
                .withdrawal-item.allowed {
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }
                
                .withdrawal-item.not-allowed {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                
                .withdrawal-item h4 {
                    font-size: 0.95rem;
                    margin: 0 0 0.25rem;
                }
                
                .withdrawal-item p {
                    font-size: 0.85rem;
                    margin: 0;
                    color: var(--gray-600);
                }
                
                .notice, .important-note {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: var(--gray-50);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    color: var(--gray-600);
                    margin-top: 1rem;
                }
                
                .important-note {
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                }
                
                                .refund-note {
                                    font-size: 0.85rem;
                                    color: var(--gray-700);
                                }
                
                                /* Event Types */
                                .event-types {
                                    margin-bottom: 2rem;
                                }
                
                                .event-types h3 {
                                    color: var(--gray-900);
                                    margin-bottom: 1rem;
                                    font-size: 1.2rem;
                                }
                
                                .event-tags {
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 0.75rem;
                                }
                
                                .event-tag {
                                    background: rgba(251, 191, 36, 0.1);
                                    color: var(--yellow-700);
                                    padding: 0.5rem 1rem;
                                    border-radius: 20px;
                                    font-size: 0.9rem;
                                    font-weight: 500;
                                    border: 1px solid rgba(251, 191, 36, 0.2);
                                }
                
                                .features-grid {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                    gap: 1.5rem;
                                    margin: 2rem 0;
                                }
                
                                .feature-card {
                                    background: var(--gray-50);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    border: 1px solid var(--gray-200);
                                }
                
                                .feature-card h4 {
                                    color: var(--gray-900);
                                    margin-bottom: 0.75rem;
                                }
                
                                .feature-card p {
                                    color: var(--gray-600);
                                    font-size: 0.9rem;
                                    margin: 0;
                                }
                
                                .responsibility-note {
                                    display: flex;
                                    gap: 1rem;
                                    background: rgba(251, 191, 36, 0.05);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    border: 1px solid rgba(251, 191, 36, 0.15);
                                    margin-top: 2rem;
                                }
                
                                .note-icon {
                                    font-size: 1.5rem;
                                    color: var(--yellow-600);
                                    flex-shrink: 0;
                                    margin-top: 0.25rem;
                                }
                
                                .responsibility-note h4 {
                                    margin-top: 0;
                                }
                
                                /* Voting */
                                .voting-options {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                    gap: 1.5rem;
                                    margin: 2rem 0;
                                }
                
                                .voting-card {
                                    background: white;
                                    border-radius: 12px;
                                    padding: 1.5rem;
                                    border: 2px solid var(--gray-200);
                                }
                
                                .voting-card.authenticated {
                                    border-top: 4px solid #3B82F6;
                                }
                
                                .voting-card.anonymous {
                                    border-top: 4px solid var(--gray-400);
                                }
                
                                .voting-header {
                                    display: flex;
                                    align-items: center;
                                    gap: 1rem;
                                    margin-bottom: 1.5rem;
                                }
                
                                .voting-icon {
                                    width: 50px;
                                    height: 50px;
                                    background: var(--gray-100);
                                    border-radius: 12px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 1.5rem;
                                }
                
                                .voting-card.authenticated .voting-icon {
                                    background: rgba(59, 130, 246, 0.1);
                                    color: #3B82F6;
                                }
                
                                .voting-card.anonymous .voting-icon {
                                    background: rgba(156, 163, 175, 0.1);
                                    color: var(--gray-500);
                                }
                
                                .voting-header h3 {
                                    margin: 0;
                                    color: var(--gray-900);
                                }
                
                                .voting-card ul {
                                    margin: 0 0 1.5rem 1.2rem;
                                    padding: 0;
                                }
                
                                .voting-card li {
                                    color: var(--gray-700);
                                    margin-bottom: 0.5rem;
                                    font-size: 0.9rem;
                                }
                
                                .voting-integrity {
                                    background: var(--gray-50);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    margin-top: 2rem;
                                }
                
                                .voting-integrity h4 {
                                    color: var(--gray-900);
                                    margin-top: 0;
                                }
                
                                .integrity-features {
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 0.75rem;
                                    margin-top: 1rem;
                                }
                
                                .integrity-tag {
                                    background: white;
                                    padding: 0.4rem 0.8rem;
                                    border-radius: 6px;
                                    font-size: 0.8rem;
                                    border: 1px solid var(--gray-200);
                                    color: var(--gray-700);
                                }
                
                                /* Prohibited */
                                .prohibited-list h3 {
                                    color: var(--gray-900);
                                    margin-bottom: 1.5rem;
                                }
                
                                .prohibited-items {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                    gap: 1.5rem;
                                }
                
                                .prohibited-item {
                                    display: flex;
                                    gap: 1rem;
                                    padding: 1.5rem;
                                    background: rgba(239, 68, 68, 0.05);
                                    border-radius: 12px;
                                    border: 1px solid rgba(239, 68, 68, 0.1);
                                }
                
                                .prohibited-icon {
                                    font-size: 1.5rem;
                                    flex-shrink: 0;
                                }
                
                                .prohibited-item h4 {
                                    margin-top: 0;
                                    color: var(--gray-900);
                                }
                
                                .prohibited-item p {
                                    margin: 0.5rem 0 0;
                                    color: var(--gray-600);
                                    font-size: 0.9rem;
                                }
                
                                .consequences {
                                    background: var(--gray-50);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    margin-top: 2rem;
                                }
                
                                .consequences h4 {
                                    margin-top: 0;
                                    color: var(--gray-900);
                                }
                
                                /* Fees */
                                .fees-grid {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                    gap: 1.5rem;
                                    margin: 2rem 0;
                                }
                
                                .fee-card {
                                    background: var(--gray-50);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    border: 1px solid var(--gray-200);
                                }
                
                                .fee-card.highlight {
                                    background: rgba(251, 191, 36, 0.1);
                                    border: 2px solid var(--yellow-500);
                                }
                
                                .fee-card h3 {
                                    margin-top: 0;
                                    color: var(--gray-900);
                                }
                
                                .fee-amount {
                                    font-size: 1.2rem;
                                    font-weight: 600;
                                    color: var(--yellow-600);
                                    margin: 0.5rem 0;
                                }
                
                                .fee-desc {
                                    color: var(--gray-600);
                                    font-size: 0.9rem;
                                    margin: 0;
                                }
                
                                .refund-policy {
                                    background: var(--gray-50);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    margin: 2rem 0;
                                }
                
                                .refund-policy h4 {
                                    margin-top: 0;
                                }
                
                                .refund-items {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                    gap: 1.5rem;
                                }
                
                                .refund-item h5 {
                                    color: var(--gray-900);
                                    margin: 0 0 0.5rem;
                                }
                
                                .refund-item p {
                                    color: var(--gray-600);
                                    font-size: 0.9rem;
                                    margin: 0;
                                }
                
                                .fee-notice {
                                    display: flex;
                                    align-items: center;
                                    gap: 1rem;
                                    background: rgba(251, 191, 36, 0.05);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    border: 1px solid rgba(251, 191, 36, 0.15);
                                }
                
                                .notice-icon {
                                    font-size: 1.5rem;
                                    color: var(--yellow-600);
                                    flex-shrink: 0;
                                }
                
                                /* Liability */
                                .liability-list h3 {
                                    color: var(--gray-900);
                                    margin-bottom: 1.5rem;
                                }
                
                                .liability-items {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                    gap: 1.5rem;
                                }
                
                                .liability-item {
                                    display: flex;
                                    gap: 1rem;
                                    padding: 1.5rem;
                                    background: var(--gray-50);
                                    border-radius: 12px;
                                    border: 1px solid var(--gray-200);
                                }
                
                                .liability-icon {
                                    font-size: 1.5rem;
                                    flex-shrink: 0;
                                }
                
                                .liability-item h4 {
                                    margin-top: 0;
                                    color: var(--gray-900);
                                }
                
                                .liability-item p {
                                    margin: 0.5rem 0 0;
                                    color: var(--gray-600);
                                    font-size: 0.9rem;
                                }
                
                                .dispute-process {
                                    background: var(--gray-50);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    margin-top: 2rem;
                                }
                
                                .dispute-process h4 {
                                    margin-top: 0;
                                }
                
                                .process-steps {
                                    display: grid;
                                    gap: 1.5rem;
                                    margin-top: 1.5rem;
                                }
                
                                .process-step {
                                    display: flex;
                                    gap: 1rem;
                                }
                
                                .step-number {
                                    background: var(--yellow-500);
                                    color: white;
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: 700;
                                    flex-shrink: 0;
                                }
                
                                .process-step h5 {
                                    margin: 0 0 0.25rem;
                                    color: var(--gray-900);
                                }
                
                                .process-step p {
                                    margin: 0;
                                    color: var(--gray-600);
                                    font-size: 0.9rem;
                                }
                
                                /* Changes */
                                .changes-info {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                    gap: 1.5rem;
                                    margin: 2rem 0;
                                }
                
                                .change-card {
                                    background: var(--gray-50);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    border: 1px solid var(--gray-200);
                                }
                
                                .change-card h3 {
                                    margin-top: 0;
                                    color: var(--gray-900);
                                }
                
                                .change-card p {
                                    color: var(--gray-600);
                                    margin-bottom: 0;
                                }
                
                                .contact-support {
                                    background: rgba(251, 191, 36, 0.05);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    border: 1px solid rgba(251, 191, 36, 0.15);
                                    margin-top: 2rem;
                                }
                
                                .contact-support h4 {
                                    margin-top: 0;
                                    color: var(--gray-900);
                                }
                
                                .contact-support p {
                                    color: var(--gray-600);
                                }
                
                                .contact-info {
                                    margin-top: 1rem;
                                }
                
                                .contact-email {
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                    color: var(--yellow-600);
                                    text-decoration: none;
                                    font-weight: 600;
                                    transition: all 0.2s;
                                }
                
                                .contact-email:hover {
                                    color: var(--yellow-700);
                                }
                
                                .contact-icon {
                                    font-size: 1.1rem;
                                }
                
                                .response-time {
                                    font-size: 0.85rem;
                                    color: var(--gray-500);
                                    margin-top: 0.5rem;
                                }
                
                                /* Mobile Responsive */
                                @media (max-width: 768px) {
                                    .terms-component {
                                        flex-direction: column;
                                        gap: 1rem;
                                    }
                
                                    .floating-tabs {
                                        position: relative;
                                        top: auto;
                                        width: 100%;
                                    }
                
                                    .floating-tabs.mobile {
                                        width: 100%;
                                    }
                
                                    .tabs-container {
                                        flex-direction: row;
                                        overflow-x: auto;
                                        padding: 0.75rem;
                                    }
                
                                    .tab-button {
                                        white-space: nowrap;
                                        padding: 0.75rem 1rem;
                                    }
                
                                    .tab-label {
                                        display: none;
                                    }
                
                                    .tab-content {
                                        padding: 1.5rem 1rem;
                                    }
                
                                    .content-header h2 {
                                        font-size: 1.4rem;
                                    }
                
                                    .links-grid {
                                        grid-template-columns: 1fr;
                                    }
                
                                    .account-cards,
                                    .token-grid,
                                    .voting-options,
                                    .prohibited-items,
                                    .fees-grid,
                                    .liability-items,
                                    .changes-info {
                                        grid-template-columns: 1fr;
                                    }
                                }
                            `}</style>
                        </div>
                    );
                };
                
                export default Terms;