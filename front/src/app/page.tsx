'use client';

import Login from "./components/Login";

export default function Home() {
  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'url("/waWall.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Login />
    </div>
  );
}
