import type { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

export default function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:'4rem', color:'#0D7C66', fontWeight:900 }}>{statusCode || 'Error'}</h1>
        <p style={{ color:'#64748B' }}>
          {statusCode === 404 ? 'Page not found' : 'Something went wrong'}
        </p>
        <a href="/" style={{ color:'#0D7C66', textDecoration:'none', marginTop:'1rem', display:'block' }}>← Go home</a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};
