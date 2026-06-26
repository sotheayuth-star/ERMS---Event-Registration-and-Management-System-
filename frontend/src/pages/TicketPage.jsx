import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../assets/css/1_global.css';
import './TicketPage.css';

function getStoredTicket() {
  try {
    const code  = localStorage.getItem('erms_ticket_code');
    const event = localStorage.getItem('erms_ticket_event') || localStorage.getItem('erms_selected_event');
    const user  = JSON.parse(localStorage.getItem('erms_user') || 'null');
    return { code, event, user };
  } catch {
    return { code: null, event: null, user: null };
  }
}

export default function TicketPage() {
  const navigate  = useNavigate();
  const qrRef     = useRef(null);
  const [fromPayment, setFromPayment] = useState(false);
  const [ticket,      setTicket]      = useState({ code: null, event: null, user: null });
  const [qrReady,     setQrReady]     = useState(false);

  useEffect(() => {
    const fp = localStorage.getItem('erms_from_payment') === 'true';
    setFromPayment(fp);
    if (fp) localStorage.removeItem('erms_from_payment');
    const t = getStoredTicket();
    setTicket(t);
  }, []);

  useEffect(() => {
    if (!ticket.code) return;
    const text = ticket.code;
    import('qrcode').then(({ default: QRCode }) => {
      if (!qrRef.current) return;
      QRCode.toCanvas(qrRef.current, text, { width: 160, margin: 1 }, err => {
        if (!err) setQrReady(true);
      });
    }).catch(() => {
      setQrReady(false);
    });
  }, [ticket.code]);

  function handleDownload() {
    const style = document.createElement('style');
    style.textContent = `@media print { .ticket-actions { display:none!important; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  }

  const userName = ticket.user ? `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email : 'Guest';
  const eventName = ticket.event || 'Event';

  if (fromPayment) {
    return (
      <div className="ticket-page">
        <div className="ticket-card">
          <div className="ticket-success">
            <div className="ticket-success-icon"><i className="ri-checkbox-circle-fill" /></div>
            <h2>Registration Successful!</h2>
            <p>Your registration has been confirmed. Your ticket has been generated and is ready to view.</p>
            <button className="btn btn-primary btn-full" onClick={() => setFromPayment(false)}>
              <i className="ri-ticket-2-line" /> View My Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-page">
      <div className="ticket-card">
        <div className="ticket-header">
          <div className="t-logo">Planning Center</div>
          <h2>{eventName}</h2>
          <div className="t-sub">Event Ticket</div>
        </div>

        <div className="ticket-body">
          <div className="ticket-qr">
            {ticket.code ? (
              <>
                <canvas ref={qrRef} style={{ borderRadius:'8px', display: qrReady ? 'block' : 'none' }} />
                {!qrReady && <div className="ticket-qr-placeholder"><i className="ri-qr-code-line" style={{ fontSize:'40px' }} /></div>}
              </>
            ) : (
              <div className="ticket-qr-placeholder"><i className="ri-qr-code-line" style={{ fontSize:'40px' }} /></div>
            )}
          </div>

          {ticket.code && (
            <div className="ticket-code">{ticket.code}</div>
          )}

          <div className="ticket-divider" />

          <div>
            {[
              ['Attendee', userName],
              ['Event',    eventName],
              ['Ticket Type', 'General Admission'],
              ['Status',   'Confirmed'],
            ].map(([k, v]) => (
              <div className="ticket-detail-row" key={k}>
                <span className="td-key">{k}</span>
                <span className="td-val">{v}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:'20px' }}>
            <div className="ticket-actions">
              <button className="btn btn-primary" onClick={handleDownload}>
                <i className="ri-download-line" /> Download
              </button>
              <Link to="/dashboard" className="btn btn-outline">
                <i className="ri-arrow-left-line" /> Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
