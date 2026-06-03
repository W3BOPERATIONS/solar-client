import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Facebook, MessageCircle, Instagram, Linkedin, Info, CalendarCheck, ListTodo } from 'lucide-react';

// ─── Per-source static data ───────────────────────────────────────────────────
const SOURCE_CONFIG = {
    facebook: {
        label: 'Facebook Leads',
        count: 92,
        accentColor: '#1877F2',
        iconBg: '#1877F2',
        ringColor: '#1877F2',
        Icon: Facebook,
        leads: [
            { srNo: 1, leadId: 'FB-1001', name: 'Rajesh Sharma',  state: 'Gujarat',     cluster: 'Ahmedabad', district: 'Gandhinagar', designation: 'Electrician',    phone: '9876543210' },
            { srNo: 2, leadId: 'FB-1002', name: 'Priya Patel',    state: 'Maharashtra',  cluster: 'Pune',      district: 'Nashik',      designation: 'Contractor',     phone: '9812345670' },
            { srNo: 3, leadId: 'FB-1003', name: 'Amit Verma',     state: 'Rajasthan',    cluster: 'Jaipur',    district: 'Jodhpur',     designation: 'Solar Installer',phone: '9001234567' },
        ],
        followUps: [
            { name: 'Rajesh Sharma', leadId: 'FB/24-25/001', mobile: '9876543210', time: '10:00 AM', border: '#93c5fd' },
            { name: 'Priya Patel',   leadId: 'FB/24-25/002', mobile: '9812345670', time: '02:00 PM', border: '#86efac' },
        ],
    },
    whatsapp: {
        label: 'WhatsApp Marketing',
        count: 22,
        accentColor: '#25D366',
        iconBg: '#25D366',
        ringColor: '#25D366',
        Icon: MessageCircle,
        leads: [
            { srNo: 1, leadId: 'WA-2001', name: 'Sneha Desai',    state: 'Gujarat',     cluster: 'Surat',     district: 'Bharuch',    designation: 'Dealer',          phone: '9090909090' },
            { srNo: 2, leadId: 'WA-2002', name: 'Karan Mehta',    state: 'Delhi',       cluster: 'Central',   district: 'South Delhi', designation: 'Retailer',       phone: '9888777666' },
        ],
        followUps: [
            { name: 'Sneha Desai',  leadId: 'WA/24-25/001', mobile: '9090909090', time: '11:00 AM', border: '#86efac' },
            { name: 'Karan Mehta',  leadId: 'WA/24-25/002', mobile: '9888777666', time: '03:30 PM', border: '#fde68a' },
        ],
    },
    instagram: {
        label: 'Instagram Inquiries',
        count: 56,
        accentColor: '#E1306C',
        iconBg: '#E1306C',
        ringColor: '#E1306C',
        Icon: Instagram,
        leads: [
            { srNo: 1, leadId: 'IG-3001', name: 'Neha Joshi',     state: 'Maharashtra', cluster: 'Mumbai',    district: 'Thane',      designation: 'Influencer',      phone: '9700012345' },
            { srNo: 2, leadId: 'IG-3002', name: 'Vikram Singh',   state: 'Punjab',      cluster: 'Ludhiana',  district: 'Amritsar',   designation: 'Electrician',     phone: '9855001234' },
            { srNo: 3, leadId: 'IG-3003', name: 'Pooja Shah',     state: 'Gujarat',     cluster: 'Vadodara',  district: 'Anand',      designation: 'Solar Installer', phone: '9600056789' },
            { srNo: 4, leadId: 'IG-3004', name: 'Arjun Nair',     state: 'Kerala',      cluster: 'Kochi',     district: 'Thrissur',   designation: 'Contractor',      phone: '9500043210' },
        ],
        followUps: [
            { name: 'Neha Joshi',   leadId: 'IG/24-25/001', mobile: '9700012345', time: '09:30 AM', border: '#f9a8d4' },
            { name: 'Vikram Singh', leadId: 'IG/24-25/002', mobile: '9855001234', time: '01:00 PM', border: '#c4b5fd' },
        ],
    },
    linkedin: {
        label: 'LinkedIn Connections',
        count: 98,
        accentColor: '#0A66C2',
        iconBg: '#0A66C2',
        ringColor: '#0A66C2',
        Icon: Linkedin,
        leads: [
            { srNo: 1, leadId: 'LI-4001', name: 'Ankit Agarwal',  state: 'Uttar Pradesh', cluster: 'Lucknow', district: 'Kanpur',    designation: 'Business Owner',  phone: '9111222333' },
            { srNo: 2, leadId: 'LI-4002', name: 'Meena Pillai',   state: 'Tamil Nadu',    cluster: 'Chennai', district: 'Coimbatore',designation: 'Engineer',        phone: '9444555666' },
            { srNo: 3, leadId: 'LI-4003', name: 'Rahul Gupta',    state: 'Haryana',       cluster: 'Gurgaon', district: 'Faridabad', designation: 'Consultant',      phone: '9333444555' },
        ],
        followUps: [
            { name: 'Ankit Agarwal', leadId: 'LI/24-25/001', mobile: '9111222333', time: '10:30 AM', border: '#93c5fd' },
            { name: 'Meena Pillai',  leadId: 'LI/24-25/002', mobile: '9444555666', time: '04:00 PM', border: '#6ee7b7' },
        ],
    },
};

const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.25)',
};
const tdStyle = {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
};

// ─── Component ────────────────────────────────────────────────────────────────
const FranchiseeManagerSubLeads = () => {
    const { id } = useParams();
    const [activeSource, setActiveSource] = useState(null);

    const config = activeSource ? SOURCE_CONFIG[activeSource] : null;

    const handleCardClick = (key) => {
        // Toggle off if same card clicked again
        setActiveSource(prev => (prev === key ? null : key));
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-[#5c8a9f] mb-6">In-Bound</h2>

            {/* ── Stats Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(SOURCE_CONFIG).map(([key, src]) => {
                    const isActive = activeSource === key;
                    return (
                        <div
                            key={key}
                            onClick={() => handleCardClick(key)}
                            style={{
                                display: 'flex',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                boxShadow: isActive
                                    ? `0 0 0 2.5px ${src.accentColor}, 0 4px 14px rgba(0,0,0,0.12)`
                                    : '0 2px 8px rgba(0,0,0,0.07)',
                                cursor: 'pointer',
                                transform: isActive ? 'translateY(-3px)' : 'none',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {/* Count + Label */}
                            <div style={{ flex: 1, background: isActive ? '#eaf4ff' : '#f0f4f8', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '26px', fontWeight: 700, color: isActive ? src.accentColor : '#1f2937' }}>{src.count}</span>
                                <span style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', textAlign: 'center' }}>{src.label}</span>
                            </div>
                            {/* Icon */}
                            <div style={{ width: '60px', background: src.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <src.Icon size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Alert (no card selected) ─────────────────────────────── */}
            {!activeSource && (
                <div style={{ background: '#e0f2f1', border: '1px solid #b2dfdb', color: '#00695c', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <Info size={20} style={{ marginRight: '10px', flexShrink: 0 }} />
                    <span>Click on any lead type card above to load the data table.</span>
                </div>
            )}

            {/* ── Table + Follow-up (shown when a card is active) ──────── */}
            {config && (
                <div>
                    {/* Source heading */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: config.iconBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <config.Icon size={18} />
                        </div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: config.accentColor, margin: 0 }}>
                            {config.label}
                        </h3>
                        <span style={{ background: config.accentColor, color: 'white', fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
                            {config.leads.length} Leads
                        </span>
                    </div>

                    {/* Table */}
                    <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflowX: 'auto', marginBottom: '28px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                            <thead>
                                <tr style={{ background: config.accentColor, color: 'white' }}>
                                    <th style={thStyle}>Sr.No.</th>
                                    <th style={thStyle}>Lead Number</th>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>State</th>
                                    <th style={thStyle}>Cluster</th>
                                    <th style={thStyle}>District</th>
                                    <th style={thStyle}>Designation</th>
                                    <th style={thStyle}>Phone No.</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Follow-up</th>
                                    <th style={{ ...thStyle, textAlign: 'center', borderRight: 'none' }}>Confirm</th>
                                </tr>
                            </thead>
                            <tbody>
                                {config.leads.map((row, idx) => (
                                    <tr
                                        key={row.srNo}
                                        style={{ background: idx % 2 === 0 ? '#f9fafb' : '#ffffff' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#f9fafb' : '#ffffff'}
                                    >
                                        <td style={tdStyle}><span style={{ color: config.accentColor, fontWeight: 600 }}>{row.srNo}</span></td>
                                        <td style={tdStyle}>{row.leadId}</td>
                                        <td style={tdStyle}>{row.name} <span style={{ fontSize: '12px' }}>✏️</span></td>
                                        <td style={tdStyle}>{row.state}</td>
                                        <td style={tdStyle}>{row.cluster} <span style={{ fontSize: '12px' }}>✏️</span></td>
                                        <td style={tdStyle}>{row.district} <span style={{ fontSize: '12px' }}>✏️</span></td>
                                        <td style={tdStyle}>{row.designation} <span style={{ fontSize: '12px' }}>✏️</span></td>
                                        <td style={tdStyle}>{row.phone}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button style={{ background: '#6b7280', color: 'white', fontSize: '12px', padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                                                Follow-up
                                            </button>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center', borderRight: 'none' }}>
                                            <button style={{ background: '#0f4e8d', color: 'white', fontSize: '12px', padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                                                Confirm
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Follow-up Schedule ─────────────────────────── */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ background: config.accentColor, color: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '15px' }}>
                            <CalendarCheck size={18} style={{ marginRight: '8px' }} />
                            Follow-up Schedule — {config.label}
                        </div>

                        <div style={{ padding: '16px' }}>
                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <button style={{ color: '#ef4444', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Overdue 3</button>
                                <button style={{ background: config.accentColor, color: 'white', fontSize: '13px', fontWeight: 500, padding: '4px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Today</button>
                                <button style={{ color: config.accentColor, fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Tomorrow</button>
                                <button style={{ color: config.accentColor, fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>This Week</button>
                                <button style={{ color: config.accentColor, fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Next Week</button>
                            </div>

                            {/* Time Slots */}
                            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', color: '#9ca3af', fontSize: '13px', paddingBottom: '16px', marginBottom: '12px' }}>
                                {['09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map(t => (
                                    <span key={t} style={{ whiteSpace: 'nowrap' }}>{t}</span>
                                ))}
                            </div>

                            {/* Today's Follow-ups */}
                            <div style={{ display: 'flex', alignItems: 'center', color: config.accentColor, fontWeight: 600, fontSize: '14px', marginBottom: '14px' }}>
                                <ListTodo size={16} style={{ marginRight: '8px' }} />
                                Today's Follow-ups
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                                {config.followUps.map((f, i) => (
                                    <div key={i} style={{ border: `1.5px solid ${f.border}`, borderRadius: '8px', padding: '14px', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }}>
                                        <h5 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '8px', fontSize: '15px' }}>{f.name}</h5>
                                        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.8' }}>
                                            <p>Lead ID: {f.leadId}</p>
                                            <p>Mobile: {f.mobile}</p>
                                            <p>Time: {f.time}</p>
                                        </div>
                                        <button style={{ marginTop: '10px', color: config.accentColor, fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                            Mark Done
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseeManagerSubLeads;
