import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const alt = 'Gleedz Event';
export const contentType = 'image/png';

export default async function Image({ params }) {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 20 }}>
          Gleedz Events
        </div>
        <div style={{ fontSize: 36, textAlign: 'center', maxWidth: 800 }}>
          Premium Event Platform
        </div>
        <div style={{ fontSize: 24, marginTop: 40, opacity: 0.9 }}>
          gleedz.com
        </div>
      </div>
    ),
    size
  );
}