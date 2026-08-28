import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="text-8xl font-extrabold gradient-text mb-4 select-none">404</div>
        <div className="text-5xl mb-6 float-anim">🛰️</div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
          Oops! The page you're looking for has drifted into the void. Let's get you back on track.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn-primary">Back to Home</Link>
          <Link to="/home" className="btn-secondary">Explore Projects</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
