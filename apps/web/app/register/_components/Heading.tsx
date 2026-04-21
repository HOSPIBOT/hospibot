'use client';

interface HeadingProps {
  title: string;
  subtitle?: string;
}

export function Heading({ title, subtitle }: HeadingProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1E293B', textAlign: 'center', marginBottom: 4 }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default Heading;
